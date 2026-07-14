import { pool } from '../../lib/db/client.ts';
import {
  joinBusinessConfigOnConfigId,
  resolveConfigScope,
  scopeParams,
  whereBusinessConfigScope,
} from './shared/configScopeHelpers.js';
import { buildLeadStatusFilterClause } from './shared/leadStatusHelpers.js';

function buildLeadConfigJoin() {
  return `
    FROM prospect_discover.initial_candidates ic
    ${joinBusinessConfigOnConfigId('ic')}`;
}

export default {
  async getLeads({
    search,
    status,
    startDate,
    endDate,
    business_id,
    version,
    page = 1,
    limit = 25,
  }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { rows: [], total: 0 };
    }

    const MAX_LIMIT = 100;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * pageSize;

    const params = scopeParams(scope);
    const addParam = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    let where = `
      WHERE ic.status != 'failed'
        AND ${whereBusinessConfigScope()}`;

    if (search) {
      const pattern = addParam(`%${search}%`);
      where += ` AND (ic.company_name ILIKE ${pattern} OR ic.website ILIKE ${pattern})`;
    }
    if (status) {
      where += buildLeadStatusFilterClause(status, addParam);
    }
    if (startDate) {
      where += ` AND ic.created_at >= ${addParam(startDate)}`;
    }
    if (endDate) {
      where += ` AND ic.created_at <= ${addParam(endDate)}`;
    }

    const fromClause = buildLeadConfigJoin();

    const [countResult, rowsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total ${fromClause} ${where}`, params),
      pool.query(
        `SELECT ic.id, ic.company_name, ic.website, ic.phone, ic.status, ic.created_at
         ${fromClause}
         ${where}
         ORDER BY ic.created_at DESC
         LIMIT ${pageSize} OFFSET ${offset}`,
        params
      ),
    ]);

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  async getLeadById({ id, business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return null;
    }

    const leadParams = [...scopeParams(scope), id];
    const leadWhere = `
      WHERE ic.id = $3
        AND ${whereBusinessConfigScope()}`;
    const fromClause = buildLeadConfigJoin();

    const [leadResult, scoreResult, emailResult] = await Promise.all([
      pool.query(
        `SELECT ic.id, ic.company_name, ic.website, ic.phone, ic.status, ic.created_at
         ${fromClause}
         ${leadWhere}`,
        leadParams
      ),
      pool.query(
        `SELECT fs.score, fs.reason, fs.supporting_facts, fs.requirement_index,
                req.clarified, req.req_index
         ${fromClause}
         JOIN prospect_discover.fit_score fs
           ON ic.place_id = fs.place_id
          AND ic.config_id = fs.config_id
         JOIN prospect_discover.requirements req
           ON req.config_id = ic.config_id
          AND req.req_index = fs.requirement_index
         ${leadWhere}
         ORDER BY req.req_index ASC`,
        leadParams
      ),
      pool.query(
        `SELECT ec.email, ec.first_name, ec.last_name, ec.job_title, ec.linkedin_url,
                ec.contact_role, ec.from, oe.outreach_email
         ${fromClause}
         JOIN prospect_discover.email_contact ec
           ON ic.place_id = ec.place_id
          AND ic.config_id = ec.config_id
         JOIN prospect_discover.outreach_email oe
           ON oe.config_id = ec.config_id
          AND oe.place_id = ec.place_id
          AND oe.email = ec.email
         ${leadWhere}`,
        leadParams
      ),
    ]);

    if (leadResult.rows.length === 0) {
      return null;
    }

    return {
      lead_info: leadResult.rows[0],
      lead_scores: scoreResult.rows,
      lead_emails: emailResult.rows,
    };
  },

  async updateLeadStatus({ id, business_id, version, status }) {
    if (!id) {
      throw new Error('lead id is missing');
    }

    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { rows: [], affectedRows: 0 };
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE prospect_discover.initial_candidates ic
       SET status = $4
       FROM prospect_discover.business_configs bc
       WHERE ic.id = $3
         AND ic.config_id = bc.id
         AND ${whereBusinessConfigScope()}
       RETURNING ic.id`,
      [...scopeParams(scope), id, status]
    );

    return { rows, affectedRows: rowCount };
  },
};
