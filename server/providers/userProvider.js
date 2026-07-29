import { pool } from '../../lib/db/client.ts';

async function findByUid(uid) {
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.firebase_uid AS "firebaseUid",
       u.email,
       u.role,
       u.business_id,
       u.first_name,
       u.last_name,
       u.is_admin,
       u.approved,
       b.business_name,
       GREATEST(
         COALESCE(b.version, 0),
         COALESCE(
           (SELECT MAX(bc.version)
            FROM prospect_discover.business_configs bc
            WHERE bc.business_id = u.business_id),
           0
         )
       ) AS config_version
     FROM prospect_discover.users u
     LEFT JOIN prospect_discover.businesses b ON b.id = u.business_id
     WHERE u.firebase_uid = $1`,
    [uid]
  );

  const user = rows[0] ?? null;
  if (user) {
    user.config_version = Number(user.config_version) || 0;
  }

  return user;
}

const MEMBERSHIP_ERRORS = {
  ONLY_PENDING: 'ONLY_PENDING',
  PENDING_JOIN_EXISTS: 'PENDING_JOIN_EXISTS',
  NO_JOIN_REQUEST: 'NO_JOIN_REQUEST',
  JOIN_REQUEST_CHANGED: 'JOIN_REQUEST_CHANGED',
  NOT_COMPANY_MEMBER: 'NOT_COMPANY_MEMBER',
  CANNOT_APPROVE: 'CANNOT_APPROVE',
  CANNOT_LEAVE_AS_OWNER: 'CANNOT_LEAVE_AS_OWNER',
  NOT_AFFILIATED: 'NOT_AFFILIATED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
};

function isLockTimeoutError(error) {
  return error?.code === '55P03';
}

async function lockUserRow(client, uid) {
  const { rows } = await client.query(
    `SELECT role, business_id
     FROM prospect_discover.users
     WHERE firebase_uid = $1
     FOR UPDATE`,
    [uid]
  );

  return rows[0] ?? null;
}

async function runMembershipTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL lock_timeout = '5s'`);

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default {
  async createUser({
    uid,
    email,
    role,
    business_id,
    first_name = null,
    last_name = null,
    approved = false,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.users (firebase_uid, email, role, business_id, first_name, last_name, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, firebase_uid AS "firebaseUid", email, role, business_id, first_name, last_name, approved`,
      [uid, email, role, business_id ?? null, first_name, last_name, approved]
    );
    return rows[0];
  },

  async deleteUserByUid(uid) {
    await pool.query(`DELETE FROM prospect_discover.users WHERE firebase_uid = $1`, [uid]);
  },

  async findOrCreate({
    uid,
    email,
    role = 'pending',
    business_id = null,
    first_name = null,
    last_name = null,
  }) {
    await pool.query(
      `INSERT INTO prospect_discover.users (firebase_uid, email, role, business_id, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (firebase_uid) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = COALESCE(prospect_discover.users.first_name, EXCLUDED.first_name),
         last_name = COALESCE(prospect_discover.users.last_name, EXCLUDED.last_name)`,
      [uid, email, role, business_id, first_name, last_name]
    );
    return findByUid(uid);
  },

  findByUid,

  async getBusinesses({ search }) {
    const params = [];
    let where = "WHERE u.role = 'owner'";

    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      params.push(`%${trimmedSearch}%`);
      const pattern = `$${params.length}`;
      where += ` AND (
        u.email ILIKE ${pattern}
        OR u.first_name ILIKE ${pattern}
        OR u.last_name ILIKE ${pattern}
        OR b.business_name ILIKE ${pattern}
      )`;
    }

    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.firebase_uid AS "firebaseUid",
         u.email,
         u.role,
         u.business_id,
         u.first_name,
         u.last_name,
         b.business_name
       FROM prospect_discover.users u
       LEFT JOIN prospect_discover.businesses b ON b.id = u.business_id
       ${where}
       ORDER BY b.business_name ASC NULLS LAST, u.email ASC`,
      params
    );
    return rows;
  },

  async updateUserBusinessId({ uid, business_id }) {
    const newBusinessId = business_id ?? null;

    await runMembershipTransaction(async (client) => {
      const user = await lockUserRow(client, uid);
      if (!user) {
        const error = new Error(MEMBERSHIP_ERRORS.USER_NOT_FOUND);
        error.code = MEMBERSHIP_ERRORS.USER_NOT_FOUND;
        throw error;
      }

      if (user.role !== 'pending') {
        const error = new Error(MEMBERSHIP_ERRORS.ONLY_PENDING);
        error.code = MEMBERSHIP_ERRORS.ONLY_PENDING;
        throw error;
      }

      if (newBusinessId === null) {
        if (user.business_id == null || user.business_id === '') {
          const error = new Error(MEMBERSHIP_ERRORS.NO_JOIN_REQUEST);
          error.code = MEMBERSHIP_ERRORS.NO_JOIN_REQUEST;
          throw error;
        }
      } else if (
        user.business_id != null &&
        user.business_id !== '' &&
        String(user.business_id) !== String(newBusinessId)
      ) {
        const error = new Error(MEMBERSHIP_ERRORS.JOIN_REQUEST_CHANGED);
        error.code = MEMBERSHIP_ERRORS.JOIN_REQUEST_CHANGED;
        throw error;
      }

      await client.query(
        `UPDATE prospect_discover.users
         SET business_id = $1
         WHERE firebase_uid = $2`,
        [newBusinessId, uid]
      );
    });

    return findByUid(uid);
  },

  async getAllBusinessMember(business_id) {
    const { rows } = await pool.query(
      `SELECT firebase_uid AS "firebaseUid", email, role, first_name, last_name
       FROM prospect_discover.users
       WHERE business_id = $1
       ORDER BY email ASC`,
      [business_id]
    );
    return rows;
  },

  async setRole(uid, role) {
    await pool.query(
      `UPDATE prospect_discover.users
       SET role = $1
       WHERE firebase_uid = $2`,
      [role, uid]
    );
    return findByUid(uid);
  },

  async leaveCompany({ uid }) {
    await runMembershipTransaction(async (client) => {
      const user = await lockUserRow(client, uid);
      if (!user) {
        const error = new Error(MEMBERSHIP_ERRORS.USER_NOT_FOUND);
        error.code = MEMBERSHIP_ERRORS.USER_NOT_FOUND;
        throw error;
      }

      if (user.role === 'owner') {
        const error = new Error(MEMBERSHIP_ERRORS.CANNOT_LEAVE_AS_OWNER);
        error.code = MEMBERSHIP_ERRORS.CANNOT_LEAVE_AS_OWNER;
        throw error;
      }

      if (user.business_id == null || user.business_id === '') {
        const error = new Error(MEMBERSHIP_ERRORS.NOT_AFFILIATED);
        error.code = MEMBERSHIP_ERRORS.NOT_AFFILIATED;
        throw error;
      }

      await client.query(
        `UPDATE prospect_discover.users
         SET business_id = NULL, role = 'pending'
         WHERE firebase_uid = $1`,
        [uid]
      );
    });

    return findByUid(uid);
  },

  async updateMemberRoleByOwner({ targetUid, ownerBusinessId, role }) {
    await runMembershipTransaction(async (client) => {
      const targetUser = await lockUserRow(client, targetUid);
      if (!targetUser) {
        const error = new Error(MEMBERSHIP_ERRORS.USER_NOT_FOUND);
        error.code = MEMBERSHIP_ERRORS.USER_NOT_FOUND;
        throw error;
      }

      if (String(targetUser.business_id) !== String(ownerBusinessId)) {
        const error = new Error(MEMBERSHIP_ERRORS.NOT_COMPANY_MEMBER);
        error.code = MEMBERSHIP_ERRORS.NOT_COMPANY_MEMBER;
        throw error;
      }

      if (role === 'member' && targetUser.role !== 'pending') {
        const error = new Error(MEMBERSHIP_ERRORS.CANNOT_APPROVE);
        error.code = MEMBERSHIP_ERRORS.CANNOT_APPROVE;
        throw error;
      }

      await client.query(
        `UPDATE prospect_discover.users
         SET role = $1
         WHERE firebase_uid = $2`,
        [role, targetUid]
      );
    });

    return findByUid(targetUid);
  },

  MEMBERSHIP_ERRORS,
  isLockTimeoutError,
};
