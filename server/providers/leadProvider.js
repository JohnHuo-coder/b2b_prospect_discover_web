import { pool } from '../../lib/db/client.ts';
import { resolveSubjectLine } from '../../lib/constants/config-defaults.ts';
import {
  joinBusinessConfigOnConfigId,
  resolveConfigScope,
  scopeParams,
  whereBusinessConfigScope,
} from './shared/configScopeHelpers.js';
import { buildLeadStatusFilterClause } from './shared/leadStatusHelpers.js';

const OUTREACH_UPDATE_CONFLICT_MESSAGE =
  'Outreach email was modified elsewhere. Refresh and try again.';

function buildLeadConfigJoin() {
  return `
    FROM prospect_discover.initial_candidates ic
    ${joinBusinessConfigOnConfigId('ic')}`;
}

async function resolveLeadContactScope({ id, business_id, version, email }) {
  const scope = resolveConfigScope({ business_id, version });
  if (!scope) {
    return null;
  }

  const leadParams = [...scopeParams(scope), id];
  const leadWhere = `
      WHERE ic.id = $3
        AND ${whereBusinessConfigScope()}`;
  const fromClause = buildLeadConfigJoin();

  const { rows } = await pool.query(
    `SELECT ic.place_id, ic.config_id, bc.sender_name, bc.subject_line, bc.business_name
     ${fromClause}
     ${leadWhere}`,
    leadParams
  );

  if (rows.length === 0) {
    return null;
  }

  const normalizedEmail = String(email).trim();
  if (!normalizedEmail) {
    return null;
  }

  const { rows: outreachRows } = await pool.query(
    `SELECT oe.outreach_email, oe.status
     FROM prospect_discover.outreach_email oe
     WHERE oe.config_id = $1
       AND oe.place_id = $2
       AND oe.email = $3`,
    [rows[0].config_id, rows[0].place_id, normalizedEmail]
  );

  if (outreachRows.length === 0) {
    return null;
  }

  return {
    scope,
    place_id: rows[0].place_id,
    config_id: rows[0].config_id,
    sender_name: rows[0].sender_name,
    subject_line: resolveSubjectLine(rows[0].subject_line, rows[0].business_name),
    email: normalizedEmail,
    outreach: outreachRows[0],
  };
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
        `SELECT ic.id, ic.company_name, ic.website, ic.phone, ic.status, ic.created_at,
                ic.industry, ic.linkedin_url, ic.employee_count, ic.source, ic.address,
                ic.distance_km, ic.employee_count_range_start, ic.employee_count_range_end,
                ic.company_type
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
                ec.contact_label, ec.confidence_level, ec."from",
                oe.outreach_email, oe.status AS outreach_status
         ${fromClause}
         JOIN prospect_discover.email_contact ec
           ON ic.place_id = ec.place_id
          AND ic.config_id = ec.config_id
         LEFT JOIN prospect_discover.outreach_email oe
           ON oe.config_id = ec.config_id
          AND oe.place_id = ec.place_id
          AND oe.email = ec.email
         ${leadWhere}
         ORDER BY ec.email ASC`,
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

  async updateOutreachEmail({
    id,
    business_id,
    version,
    email,
    outreach_email,
    status,
  }) {
    const contactScope = await resolveLeadContactScope({
      id,
      business_id,
      version,
      email,
    });

    if (!contactScope) {
      return { affectedRows: 0 };
    }

    const currentStatus = String(contactScope.outreach.status || '').toLowerCase();
    const updates = [];
    const params = [
      contactScope.config_id,
      contactScope.place_id,
      contactScope.email,
    ];

    if (typeof outreach_email === 'string') {
      if (currentStatus !== 'ready') {
        throw new Error('Only ready outreach emails can be edited');
      }
      params.push(outreach_email);
      updates.push(`outreach_email = $${params.length}`);
    }

    if (typeof status === 'string') {
      const nextStatus = status.trim().toLowerCase();
      if (nextStatus !== 'ready' && nextStatus !== 'sent') {
        throw new Error('Invalid outreach status');
      }

      if (nextStatus === 'ready' && currentStatus !== 'sent') {
        throw new Error('Only sent outreach emails can be marked as ready');
      }

      if (nextStatus === 'sent' && currentStatus !== 'ready') {
        throw new Error('Only ready outreach emails can be marked as sent');
      }

      params.push(nextStatus);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length === 0) {
      throw new Error('No outreach updates provided');
    }

    params.push(currentStatus);
    const expectedStatusParam = params.length;

    const { rowCount } = await pool.query(
      `UPDATE prospect_discover.outreach_email
       SET ${updates.join(', ')}
       WHERE config_id = $1
         AND place_id = $2
         AND email = $3
         AND LOWER(status) = $${expectedStatusParam}`,
      params
    );

    if (!rowCount) {
      throw new Error(OUTREACH_UPDATE_CONFLICT_MESSAGE);
    }

    return {
      affectedRows: rowCount,
      outreach_email:
        typeof outreach_email === 'string'
          ? outreach_email
          : contactScope.outreach.outreach_email,
      status:
        typeof status === 'string'
          ? status.trim().toLowerCase()
          : contactScope.outreach.status,
    };
  },

  async getOutreachSendContext({
    id,
    business_id,
    version,
    email,
    outreach_email,
  }) {
    const contactScope = await resolveLeadContactScope({
      id,
      business_id,
      version,
      email,
    });

    if (!contactScope) {
      return null;
    }

    const currentStatus = String(contactScope.outreach.status || '').toLowerCase();
    if (currentStatus !== 'ready') {
      throw new Error('Only ready outreach emails can be sent');
    }

    const body =
      typeof outreach_email === 'string' && outreach_email.trim()
        ? outreach_email.trim()
        : String(contactScope.outreach.outreach_email || '').trim();

    if (!body) {
      throw new Error('Outreach email body is empty');
    }

    return {
      to: contactScope.email,
      body,
      sender_name: contactScope.sender_name,
      subject_line: contactScope.subject_line,
      config_id: contactScope.config_id,
      place_id: contactScope.place_id,
    };
  },

  async finalizeOutreachSend({
    id,
    business_id,
    version,
    email,
    outreach_email,
  }) {
    const contactScope = await resolveLeadContactScope({
      id,
      business_id,
      version,
      email,
    });

    if (!contactScope) {
      return { affectedRows: 0 };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (typeof outreach_email === 'string' && outreach_email.trim()) {
        await client.query(
          `UPDATE prospect_discover.outreach_email
           SET outreach_email = $4
           WHERE config_id = $1
             AND place_id = $2
             AND email = $3
             AND status = 'ready'`,
          [
            contactScope.config_id,
            contactScope.place_id,
            contactScope.email,
            outreach_email.trim(),
          ]
        );
      }

      const { rowCount } = await client.query(
        `UPDATE prospect_discover.outreach_email
         SET status = 'sent'
         WHERE config_id = $1
           AND place_id = $2
           AND email = $3
           AND status = 'ready'`,
        [contactScope.config_id, contactScope.place_id, contactScope.email]
      );

      if (!rowCount) {
        throw new Error('Outreach email is no longer ready to send');
      }

      await client.query(
        `UPDATE prospect_discover.initial_candidates ic
         SET status = 'sent'
         FROM prospect_discover.business_configs bc
         WHERE ic.id = $3
           AND ic.config_id = bc.id
           AND ${whereBusinessConfigScope()}
           AND LOWER(ic.status) = 'ready'`,
        [...scopeParams(contactScope.scope), id]
      );

      await client.query('COMMIT');
      return {
        affectedRows: rowCount,
        outreach_email:
          typeof outreach_email === 'string' && outreach_email.trim()
            ? outreach_email.trim()
            : contactScope.outreach.outreach_email,
        status: 'sent',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteLeadContact({ id, business_id, version, email }) {
    if (!id || !email) {
      throw new Error('Lead id and email are required');
    }

    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { affectedRows: 0 };
    }

    const leadParams = [...scopeParams(scope), id];
    const fromClause = buildLeadConfigJoin();
    const leadWhere = `
      WHERE ic.id = $3
        AND ${whereBusinessConfigScope()}`;

    const { rows: leadRows } = await pool.query(
      `SELECT ic.place_id, ic.config_id
       ${fromClause}
       ${leadWhere}`,
      leadParams
    );

    if (leadRows.length === 0) {
      return { affectedRows: 0 };
    }

    const { place_id, config_id } = leadRows[0];
    const normalizedEmail = String(email).trim();
    if (!normalizedEmail) {
      throw new Error('email is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM prospect_discover.outreach_email
         WHERE config_id = $1
           AND place_id = $2
           AND email = $3`,
        [config_id, place_id, normalizedEmail]
      );

      const { rowCount } = await client.query(
        `DELETE FROM prospect_discover.email_contact
         WHERE config_id = $1
           AND place_id = $2
           AND email = $3`,
        [config_id, place_id, normalizedEmail]
      );

      await client.query('COMMIT');
      return { affectedRows: rowCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
