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
       b.business_name
     FROM prospect_discover.users u
     LEFT JOIN prospect_discover.businesses b ON b.id = u.business_id
     WHERE u.firebase_uid = $1`,
    [uid]
  );
  return rows[0] ?? null;
}

export default {
  async createUser({ uid, email, role, business_id, first_name = null, last_name = null }) {
    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.users (firebase_uid, email, role, business_id, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firebase_uid AS "firebaseUid", email, role, business_id, first_name, last_name`,
      [uid, email, role, business_id ?? null, first_name, last_name]
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
    const { rowCount } = await pool.query(
      `UPDATE prospect_discover.users
       SET business_id = $1
       WHERE firebase_uid = $2`,
      [business_id ?? null, uid]
    );

    if (rowCount === 0) {
      return null;
    }

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
};
