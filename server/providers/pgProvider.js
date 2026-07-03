import { pool } from '../../lib/db/client.ts';

async function upsertBusinessConfigPartial(business_id, fields) {
  if (!business_id) {
    throw new Error('business_id is required');
  }

  const columns = Object.keys(fields);
  const values = Object.values(fields);
  const columnList = ['business_id', ...columns].join(', ');
  const placeholders = columns.map((_, index) => `$${index + 2}`).join(', ');
  const setClause = columns
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(',\n        ');

  const { rows, rowCount } = await pool.query(
    `INSERT INTO prospect_discover.business_config (${columnList})
     VALUES ($1, ${placeholders})
     ON CONFLICT (business_id) DO UPDATE SET
       ${setClause}
     RETURNING *`,
    [business_id, ...values]
  );

  return { row: rows[0] ?? null, affectedRows: rowCount };
}

export default {
  async createBusiness({ uid, business_name }) {
    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.businesses (firebase_uid, business_name)
       VALUES ($1, $2)
       RETURNING id`,
      [uid, business_name]
    );
    return { business_id: rows[0].id, uid, business_name };
  },

  async createUser({ uid, email, role, business_id }) {
    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.users (firebase_uid, email, role, business_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, firebase_uid AS "firebaseUid", email, role, business_id`,
      [uid, email, role, business_id ?? null]
    );
    return rows[0];
  },

  async deleteBusinessByUid(uid) {
    await pool.query(`DELETE FROM prospect_discover.businesses WHERE firebase_uid = $1`, [uid]);
  },

  async deleteUserByUid(uid) {
    await pool.query(`DELETE FROM prospect_discover.users WHERE firebase_uid = $1`, [uid]);
  },

  async findOrCreate({ uid, email, role = 'pending', business_id = null }) {
    await pool.query(
      `INSERT INTO prospect_discover.users (firebase_uid, email, role, business_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid) DO NOTHING`,
      [uid, email, role, business_id]
    );
    return this.findByUid(uid);
  },

  async findByUid(uid) {
    const { rows } = await pool.query(
      `SELECT id, firebase_uid AS "firebaseUid", email, role, business_id
       FROM prospect_discover.users
       WHERE firebase_uid = $1`,
      [uid]
    );
    return rows[0] ?? null;
  },

  async getAllBusinessMember(business_id) {
    const { rows } = await pool.query(
      `SELECT firebase_uid AS "firebaseUid", email, role
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
    return this.findByUid(uid);
  },

  async getLeads({
    search,
    status,
    startDate,
    endDate,
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

    const table = 'prospect_discover.initial_candidates';

    const [countResult, rowsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM ${table} ic ${where}`, params),
      pool.query(
        `SELECT ic.id, ic.company_name, ic.website, ic.status, ic.created_at
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

  async getLeadById(id) {
    const [leadResult, scoreResult, emailResult] = await Promise.all([
      pool.query(
        `SELECT ic.id, ic.company_name, ic.website, ic.phone, ic.status, ic.created_at
         FROM prospect_discover.initial_candidates ic
         WHERE ic.id = $1`,
        [id]
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
         WHERE ic.id = $1`,
        [id]
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
         WHERE ic.id = $1`,
        [id]
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

  _buildUnsentWhere({
    search,
    status,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    descriptionSearch,
    requireEmail,
  } = {}) {
    const LIMIT = 20;
    let where = `WHERE COALESCE(d.receipt_status, 'pending') <> 'sent'`;
    const params = [];

    if (search) {
      where += ` AND (dn.first_name LIKE ? OR dn.last_name LIKE ? OR dn.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status && status !== 'sent') {
      where += ` AND d.receipt_status = ?`;
      params.push(status);
    }
    if (minAmount) {
      where += ` AND d.amount >= ?`;
      params.push(minAmount);
    }
    if (maxAmount) {
      where += ` AND d.amount <= ?`;
      params.push(maxAmount);
    }
    if (startDate) {
      where += ` AND d.donation_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      where += ` AND d.donation_date <= ?`;
      params.push(endDate);
    }
    if (descriptionSearch) {
      where += ` AND d.description LIKE ?`;
      params.push(`%${descriptionSearch}%`);
    }

    if (requireEmail) {
      where += ` AND dn.email IS NOT NULL AND dn.email <> ''`;
    }

    return { where, params, limit: LIMIT };
  },

  async getUnsentIds(filters = {}) {
    const { where, params, limit } = this._buildUnsentWhere({
      ...filters,
      requireEmail: true,
    });
    const [rows] = await pool.execute(
      `SELECT d.id FROM donations d JOIN donors dn ON d.donor_id = dn.id
       ${where} ORDER BY d.donation_date DESC, d.id DESC LIMIT ${limit}`,
      params
    );
    return rows.map((r) => r.id);
  },

  async getUnsentRecipients(filters = {}) {
    const { where, params, limit } = this._buildUnsentWhere({
      ...filters,
      requireEmail: true,
    });
    const [rows] = await pool.execute(
      `SELECT d.id, dn.first_name, dn.last_name, dn.email
       FROM donations d
       JOIN donors dn ON d.donor_id = dn.id
       ${where}
       ORDER BY d.donation_date DESC, d.id DESC
       LIMIT ${limit}`,
      params
    );
    return rows;
  },

  async markManyReceiptStatus(ids, receipt_status) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { affectedRows: 0 };
    }
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE donations SET receipt_status = ? WHERE id IN (${placeholders})`,
      [receipt_status, ...ids]
    );
    return { affectedRows: result.affectedRows };
  },

  async deleteDonation(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[donation]] = await conn.execute(
        'SELECT donor_id FROM donations WHERE id = ?',
        [id]
      );
      if (!donation) {
        await conn.rollback();
        return { affectedRows: 0 };
      }
      const [del] = await conn.execute('DELETE FROM donations WHERE id = ?', [
        id,
      ]);
      const [[{ cnt }]] = await conn.execute(
        'SELECT COUNT(*) AS cnt FROM donations WHERE donor_id = ?',
        [donation.donor_id]
      );
      if (parseInt(cnt) === 0) {
        await conn.execute('DELETE FROM donors WHERE id = ?', [
          donation.donor_id,
        ]);
      }
      await conn.commit();
      return { affectedRows: del.affectedRows };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async deleteLead(id) {
    const [result] = await pool.execute('DELETE FROM initial_candidates WHERE id = ?', [
      id,
    ]);
    return { affectedRows: result.affectedRows };
  },

  async getDashboardSummary({ business_id }) {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'sent') AS total_sent,
        COUNT(*) FILTER (WHERE status = 'rejected') AS total_rejected,
        COUNT(*) FILTER (WHERE status = 'heard_back') AS total_heard_back,
        COUNT(*) FILTER (WHERE status = 'pending') AS total_pending
       FROM prospect_discover.initial_candidates
       WHERE business_id = $1`, [business_id]
    );

    const row = rows[0];
    return {
      total_sent: Number(row.total_sent),
      total_rejected: Number(row.total_rejected),
      total_heard_back: Number(row.total_heard_back),
      total_pending: Number(row.total_pending),
    };
  },

  async upsertBusinessProfile({
    business_id,
    business_name,
    sender_name,
    collaboration_intent,
  }) {
    return upsertBusinessConfigPartial(business_id, {
      business_name,
      sender_name,
      collaboration_intent,
    });
  },

  async upsertClassificationCutoffs({
    business_id,
    low_conf_cutoff_email_classification,
    qualified_conf_email_classification,
    fit_score_cutoff,
  }) {
    return upsertBusinessConfigPartial(business_id, {
      low_conf_cutoff_email_classification,
      qualified_conf_email_classification,
      fit_score_cutoff,
    });
  },

  async upsertSearchConfig({ business_id, search_keyword, search_location }) {
    return upsertBusinessConfigPartial(business_id, {
      search_keyword,
      search_location,
    });
  },

  async upsertRunSettings({
    business_id,
    number_of_candidates_per_run,
    min_words,
    max_words,
  }) {
    return upsertBusinessConfigPartial(business_id, {
      number_of_candidates_per_run,
      min_words,
      max_words,
    });
  },

  async upsertContactFilters({
    business_id,
    contact_titles,
    contact_categories,
  }) {
    if (!Array.isArray(contact_titles) || !Array.isArray(contact_categories)) {
      throw new Error('contact_titles and contact_categories must be arrays');
    }

    return upsertBusinessConfigPartial(business_id, {
      contact_titles,
      contact_categories,
    });
  },

  async getBusinessConfig(business_id) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const { rows } = await pool.query(
      `SELECT
        business_id,
        business_name,
        sender_name,
        collaboration_intent,
        search_keyword,
        search_location,
        number_of_candidates_per_run,
        min_words,
        max_words,
        low_conf_cutoff_email_classification,
        qualified_conf_email_classification,
        fit_score_cutoff,
        contact_titles,
        contact_categories
       FROM prospect_discover.business_config
       WHERE business_id = $1`,
      [business_id]
    );

    return rows[0] ?? null;
  },

  async upsertRequirements({ business_id, requirements }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return { rows: [], affectedRows: 0 };
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO prospect_discover.requirements (business_id, clarified)
       SELECT $1, unnest($2::text[])
       ON CONFLICT (business_id, clarified) DO NOTHING
       RETURNING *`,
      [business_id, requirements]
    );

    return { rows, affectedRows: rowCount };
  },

  async updateLeadStatus(id, {status}){
    if (!id) {
      throw new Error('lead id is missing');
    }
    const { rows, rowCount } = await pool.query(
      `UPDATE prospect_discover.initial_candidates
      SET status = $2
      WHERE id = $1`,
      [id, status]
    )
    return { rows, affectedRows: rowCount };
  }
};
