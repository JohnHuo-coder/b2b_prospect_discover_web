import { pool } from '../../lib/db/client.ts';
import { ACCESS_REQUEST_STATUS } from '../../lib/constants/access-request.ts';

const LIST_ACCESS_REQUESTS_SQL = `
  SELECT
    r.id,
    r.user_id,
    r.reason,
    r.status,
    r.created_at,
    u.email,
    u.role,
    u.approved AS user_approved,
    u.first_name,
    u.last_name,
    b.business_name
  FROM prospect_discover.requests r
  INNER JOIN prospect_discover.users u ON u.id = r.user_id
  LEFT JOIN prospect_discover.businesses b ON b.id = u.business_id
  ORDER BY r.created_at DESC
`;

async function approveRequestById(client, requestId) {
  const { rows } = await client.query(
    `UPDATE prospect_discover.requests
     SET status = $1
     WHERE id = $2 AND status = $3
     RETURNING id, user_id, status`,
    [
      ACCESS_REQUEST_STATUS.APPROVED,
      requestId,
      ACCESS_REQUEST_STATUS.ACTIVE,
    ]
  );

  const request = rows[0];
  if (!request) {
    return null;
  }

  await client.query(
    `UPDATE prospect_discover.users
     SET approved = TRUE
     WHERE id = $1`,
    [request.user_id]
  );

  return request;
}

export default {
  async createAccessRequest({ user_id, reason }) {
    const normalizedReason =
      typeof reason === 'string' ? reason.trim() : '';
    if (!normalizedReason) {
      throw new Error('reason is required');
    }

    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.requests (user_id, reason, status)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, reason, status, created_at`,
      [user_id, normalizedReason, ACCESS_REQUEST_STATUS.ACTIVE]
    );

    return rows[0];
  },

  async hasAccessRequest(user_id) {
    const { rows } = await pool.query(
      `SELECT 1
       FROM prospect_discover.requests
       WHERE user_id = $1
         AND status = $2
       LIMIT 1`,
      [user_id, ACCESS_REQUEST_STATUS.ACTIVE]
    );

    return rows.length > 0;
  },

  async listAccessRequests() {
    const { rows } = await pool.query(LIST_ACCESS_REQUESTS_SQL);
    return rows;
  },

  async approveAccessRequest(requestId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const request = await approveRequestById(client, requestId);
      if (!request) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query('COMMIT');
      return request;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async denyAccessRequest(requestId) {
    const { rows } = await pool.query(
      `UPDATE prospect_discover.requests
       SET status = $1
       WHERE id = $2 AND status = $3
       RETURNING id, user_id, status`,
      [
        ACCESS_REQUEST_STATUS.DENIED,
        requestId,
        ACCESS_REQUEST_STATUS.ACTIVE,
      ]
    );

    return rows[0] ?? null;
  },

  async approveAllActiveAccessRequests() {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: activeRequests } = await client.query(
        `SELECT id
         FROM prospect_discover.requests
         WHERE status = $1
         ORDER BY created_at ASC`,
        [ACCESS_REQUEST_STATUS.ACTIVE]
      );

      let approvedCount = 0;

      for (const row of activeRequests) {
        const approved = await approveRequestById(client, row.id);
        if (approved) {
          approvedCount += 1;
        }
      }

      await client.query('COMMIT');
      return { approvedCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
