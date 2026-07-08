import { pool } from '../../lib/db/client.ts';

export default {
  async getDashboardSummary({ business_id }) {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'sent') AS total_sent,
        COUNT(*) FILTER (WHERE status = 'rejected') AS total_rejected,
        COUNT(*) FILTER (WHERE status = 'heard_back') AS total_heard_back,
        COUNT(*) FILTER (WHERE status = 'pending') AS total_pending
       FROM prospect_discover.initial_candidates
       WHERE business_id = $1`,
      [business_id]
    );

    const row = rows[0];
    return {
      total_sent: Number(row.total_sent),
      total_rejected: Number(row.total_rejected),
      total_heard_back: Number(row.total_heard_back),
      total_pending: Number(row.total_pending),
    };
  },
};
