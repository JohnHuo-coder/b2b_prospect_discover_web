import { pool } from '../../lib/db/client.ts';

export default {
  async getLeads({
    search,
    status,
    startDate,
    endDate,
    business_id,
    page = 1,
    limit = 25,
  }) {
    const MAX_LIMIT = 100;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * pageSize;

    const params = [];
    const addParam = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    let where = "WHERE ic.status != 'failed'";

    if (search) {
      const pattern = addParam(`%${search}%`);
      where += ` AND (ic.company_name ILIKE ${pattern} OR ic.website ILIKE ${pattern})`;
    }
    if (status) {
      where += ` AND ic.status = ${addParam(status)}`;
    }
    if (startDate) {
      where += ` AND ic.created_at >= ${addParam(startDate)}`;
    }
    if (endDate) {
      where += ` AND ic.created_at <= ${addParam(endDate)}`;
    }
    if (business_id) {
      where += ` AND ic.business_id = ${addParam(business_id)}`;
    }

    const table = 'prospect_discover.initial_candidates';

    const [countResult, rowsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM ${table} ic ${where}`, params),
      pool.query(
        `SELECT ic.id, ic.company_name, ic.website, ic.phone, ic.status, ic.created_at
         FROM ${table} ic
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

  async getLeadById({ id, business_id }) {
    const leadParams = [id];
    let leadWhere = "WHERE ic.id = $1";

    if (business_id != null) {
      leadParams.push(business_id);
      leadWhere += ` AND ic.business_id = $${leadParams.length}`;
    }

    const [leadResult, scoreResult, emailResult] = await Promise.all([
      pool.query(
        `SELECT ic.id, ic.company_name, ic.website, ic.phone, ic.status, ic.created_at
         FROM prospect_discover.initial_candidates ic
         ${leadWhere}`,
        leadParams
      ),
      pool.query(
        `SELECT fs.score, fs.reason, fs.supporting_facts, fs.requirement_index,
                req.clarified, req.req_index
         FROM prospect_discover.initial_candidates ic
         JOIN prospect_discover.fit_score fs
           ON ic.place_id = fs.place_id
          AND ic.business_id = fs.business_id
         JOIN prospect_discover.requirements req
           ON req.business_id = ic.business_id
          AND req.req_index = fs.requirement_index
         ${leadWhere}
         ORDER BY req.req_index ASC`,
        leadParams
      ),
      pool.query(
        `SELECT ec.email, ec.first_name, ec.last_name, ec.job_title, ec.linkedin_url,
                ec.contact_role, ec.from, oe.outreach_email
         FROM prospect_discover.initial_candidates ic
         JOIN prospect_discover.email_contact ec
           ON ic.place_id = ec.place_id
          AND ic.business_id = ec.business_id
         JOIN prospect_discover.outreach_email oe
           ON oe.business_id = ec.business_id
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

  async deleteLead(id) {
    const [result] = await pool.execute('DELETE FROM initial_candidates WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
  },

  async updateLeadStatus({ id, business_id, status }) {
    if (!id) {
      throw new Error('lead id is missing');
    }
    const { rows, rowCount } = await pool.query(
      `UPDATE prospect_discover.initial_candidates
       SET status = $1
       WHERE id = $2
        AND business_id = $3`,
      [status, id, business_id]
    );
    return { rows, affectedRows: rowCount };
  },
};
