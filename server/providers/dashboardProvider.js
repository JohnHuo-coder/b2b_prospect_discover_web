import { pool } from '../../lib/db/client.ts';
import { pendingLeadStatusSql } from './shared/leadStatusHelpers.js';

export default {
  async getDashboardSummary({ business_id, version }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const currentVersion = Number(version) || 0;
    if (currentVersion === 0) {
      return {
        total_sent: 0,
        total_rejected: 0,
        total_heard_back: 0,
        total_pending: 0,
      };
    }

    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE ic.status = 'sent') AS total_sent,
        COUNT(*) FILTER (WHERE ic.status = 'rejected') AS total_rejected,
        COUNT(*) FILTER (WHERE ic.status = 'heard_back') AS total_heard_back,
        COUNT(*) FILTER (WHERE ${pendingLeadStatusSql('ic.status')}) AS total_pending
       FROM prospect_discover.initial_candidates ic
       JOIN prospect_discover.business_configs bc
        ON ic.config_id = bc.id
       WHERE bc.business_id = $1
        AND bc.version = $2
        AND ic.status != 'failed'`,
      [business_id, currentVersion]
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
