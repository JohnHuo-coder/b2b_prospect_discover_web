import { pool } from '../../lib/db/client.ts';

export default {
  async createAccessRequest({ user_id, reason }) {
    const normalizedReason =
      typeof reason === 'string' ? reason.trim() : '';
    if (!normalizedReason) {
      throw new Error('reason is required');
    }

    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.requests (user_id, reason)
       VALUES ($1, $2)
       RETURNING id, user_id, reason, created_at`,
      [user_id, normalizedReason]
    );

    return rows[0];
  },

  async hasAccessRequest(user_id) {
    const { rows } = await pool.query(
      `SELECT 1
       FROM prospect_discover.requests
       WHERE user_id = $1
       LIMIT 1`,
      [user_id]
    );

    return rows.length > 0;
  },
};
