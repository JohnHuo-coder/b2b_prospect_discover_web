import { pool } from '../../lib/db/client.ts';

const fitScoreOverallStatusCase = `
  CASE
    WHEN BOOL_OR(fs.status = 'failed') THEN 'failed'
    WHEN BOOL_OR(fs.status = 'rejected') THEN 'rejected'
    ELSE 'accepted'
  END AS overall_status`;

export default {
  async getInfoAcquisitionStatus({
    business_id,
    page = 1,
    limit = 25,
    search,
    status,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const MAX_LIMIT = 100;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * pageSize;

    const params = [business_id];
    const addParam = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    const groupedQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            CASE
                WHEN BOOL_OR(st.status = 'failed') THEN 'failed'
                ELSE 'success'
            END AS overall_status
        FROM prospect_discover.get_web_content_status st
        JOIN prospect_discover.initial_candidates ic
            ON st.place_id = ic.place_id
            AND st.business_id = ic.business_id
        WHERE st.business_id = $1
        GROUP BY
            st.business_id,
            st.place_id,
            ic.id,
            ic.company_name,
            ic.website`;

    let filterWhere = 'WHERE 1=1';

    if (search) {
      const pattern = addParam(`%${search}%`);
      filterWhere += ` AND (grouped.company_name ILIKE ${pattern} OR grouped.website ILIKE ${pattern})`;
    }

    if (status) {
      filterWhere += ` AND grouped.overall_status = ${addParam(status)}`;
    }

    const limitParam = addParam(pageSize);
    const offsetParam = addParam(offset);

    const [countResult, rowsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
         FROM (${groupedQuery}) grouped
         ${filterWhere}`,
        params.slice(0, params.length - 2)
      ),
      pool.query(
        `SELECT grouped.*
         FROM (${groupedQuery}) grouped
         ${filterWhere}
         ORDER BY grouped.id ASC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params
      ),
    ]);

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  async getInfoAcquisitionStatusDetail({ candidate_id, business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }
    const { rows } = await pool.query(
      `SELECT
            ic.company_name,
            ic.website,
            req.req_index AS requirement_index,
            req.clarified AS requirement_text,
            COALESCE(st.has_url_no_web_content_miss, 0) AS has_url_no_web_content_miss,
            COALESCE(st.insufficient_content_miss, 0) AS insufficient_content_miss,
            st.status,
            st.final_stage,
            st.reason,
            COALESCE(st.no_facts_extracted_miss, 0) AS no_facts_extracted_miss,
            COALESCE(st.no_best_url_subset_miss, 0) AS no_best_url_subset_miss
        FROM prospect_discover.get_web_content_status st
        JOIN prospect_discover.initial_candidates ic
            ON st.place_id = ic.place_id
            AND st.business_id = ic.business_id
        LEFT JOIN prospect_discover.requirements req
            ON st.business_id = req.business_id
            AND req.req_index = st.requirement_index
        WHERE ic.business_id = $1
          AND ic.id = $2
        ORDER BY req.req_index ASC NULLS LAST`,
      [business_id, candidate_id]
    );
    return rows;
  },

  async getInfoAcquisitionStatusSummary({ business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const [overallResult, requirementsResult] = await Promise.all([
      pool.query(
        `WITH grouped AS (
           SELECT
             ic.id,
             CASE
               WHEN BOOL_OR(st.status = 'failed') THEN 'failed'
               ELSE 'success'
             END AS overall_status
           FROM prospect_discover.get_web_content_status st
           JOIN prospect_discover.initial_candidates ic
             ON st.place_id = ic.place_id
            AND st.business_id = ic.business_id
           WHERE st.business_id = $1
           GROUP BY st.business_id, st.place_id, ic.id
         )
         SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'success')::int AS success_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'failed')::int AS failed_candidates
         FROM grouped`,
        [business_id]
      ),
      pool.query(
        `SELECT req_index, clarified
         FROM prospect_discover.requirements
         WHERE business_id = $1
         ORDER BY req_index ASC`,
        [business_id]
      ),
    ]);

    return {
      overall: overallResult.rows[0],
      requirements: requirementsResult.rows,
    };
  },

  async getInfoAcquisitionStatusSummaryByReq({
    business_id,
    requirement_index,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }

    const params = [business_id, requirement_index];

    const [countsResult, requirementResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE status = 'succeed')::int AS success_candidates,
           COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_candidates
         FROM prospect_discover.get_web_content_status
         WHERE business_id = $1
           AND requirement_index = $2`,
        params
      ),
      pool.query(
        `SELECT req_index, clarified
         FROM prospect_discover.requirements
         WHERE business_id = $1
           AND req_index = $2`,
        params
      ),
    ]);

    return {
      stats: countsResult.rows[0],
      requirement: requirementResult.rows[0] ?? null,
    };
  },

  async getInfoAcquisitionStatusWorkflowByReq({
    business_id,
    requirement_index,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }

    const params = [business_id, requirement_index];

    const [countsResult, requirementResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS failed_candidates,
           final_stage
         FROM prospect_discover.get_web_content_status
         WHERE business_id = $1
         AND requirement_index = $2
         AND status = 'failed'
         GROUP BY final_stage`,
        params
      ),
      pool.query(
        `SELECT req_index, clarified
         FROM prospect_discover.requirements
         WHERE business_id = $1
           AND req_index = $2`,
        params
      )
    ]);

    return {
      stages: countsResult.rows.map((row) => ({
        final_stage: row.final_stage,
        failed_candidates: Number(row.failed_candidates),
      })),
      requirement: requirementResult.rows[0] ?? null,
    };
  },

  async getInfoAcquisitionStageDetail({
    business_id,
    requirement_index,
    final_stage
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }
    if (!final_stage) {
      throw new Error('final_stage is required');
    }

    const params = [business_id, requirement_index, final_stage];

    const { rows } = await pool.query(
      `SELECT ic.id, st.reason, ic.company_name, ic.website
       FROM prospect_discover.get_web_content_status st
       JOIN prospect_discover.initial_candidates ic
         ON st.business_id = ic.business_id
         AND st.place_id = ic.place_id
       WHERE st.business_id = $1
         AND st.requirement_index = $2
         AND st.status = 'failed'
         AND st.final_stage = $3
       ORDER BY ic.company_name`,
      params
    );

    return rows;
  },


  async getFitScoreStatus({
    business_id,
    page = 1,
    limit = 25,
    search,
    status,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const MAX_LIMIT = 100;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * pageSize;

    const params = [business_id];
    const addParam = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    const groupedQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            ${fitScoreOverallStatusCase}
        FROM prospect_discover.fit_score fs
        JOIN prospect_discover.initial_candidates ic
            ON fs.place_id = ic.place_id
            AND fs.business_id = ic.business_id
        WHERE fs.business_id = $1
        GROUP BY
            fs.business_id,
            fs.place_id,
            ic.id,
            ic.company_name,
            ic.website`;

    let filterWhere = 'WHERE 1=1';

    if (search) {
      const pattern = addParam(`%${search}%`);
      filterWhere += ` AND (grouped.company_name ILIKE ${pattern} OR grouped.website ILIKE ${pattern})`;
    }

    if (status) {
      filterWhere += ` AND grouped.overall_status = ${addParam(status)}`;
    }

    const limitParam = addParam(pageSize);
    const offsetParam = addParam(offset);

    const [countResult, rowsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
         FROM (${groupedQuery}) grouped
         ${filterWhere}`,
        params.slice(0, params.length - 2)
      ),
      pool.query(
        `SELECT grouped.*
         FROM (${groupedQuery}) grouped
         ${filterWhere}
         ORDER BY grouped.id ASC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params
      ),
    ]);

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  async getFitScoreStatusDetail({ candidate_id, business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }
    const { rows } = await pool.query(
      `SELECT
            ic.company_name,
            ic.website,
            req.req_index AS requirement_index,
            req.clarified AS requirement_text,
            fs.score,
            fs.reason,
            fs.supporting_facts,
            fs.status
        FROM prospect_discover.fit_score fs
        JOIN prospect_discover.initial_candidates ic
            ON fs.place_id = ic.place_id
            AND fs.business_id = ic.business_id
        LEFT JOIN prospect_discover.requirements req
            ON fs.business_id = req.business_id
            AND req.req_index = fs.requirement_index
        WHERE ic.business_id = $1
          AND ic.id = $2
        ORDER BY req.req_index ASC NULLS LAST`,
      [business_id, candidate_id]
    );
    return rows;
  },

  async getFitScoreStatusSummary({ business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const [overallResult, requirementsResult] = await Promise.all([
      pool.query(
        `WITH grouped AS (
           SELECT
             ic.id,
             ${fitScoreOverallStatusCase}
           FROM prospect_discover.fit_score fs
           JOIN prospect_discover.initial_candidates ic
             ON fs.place_id = ic.place_id
            AND fs.business_id = ic.business_id
           WHERE fs.business_id = $1
           GROUP BY fs.business_id, fs.place_id, ic.id
         )
         SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'accepted')::int AS accepted_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'rejected')::int AS rejected_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'failed')::int AS failed_candidates
         FROM grouped`,
        [business_id]
      ),
      pool.query(
        `SELECT req_index, clarified
         FROM prospect_discover.requirements
         WHERE business_id = $1
         ORDER BY req_index ASC`,
        [business_id]
      ),
    ]);

    return {
      overall: overallResult.rows[0],
      requirements: requirementsResult.rows,
    };
  },

  async getFitScoreStatusSummaryByReq({
    business_id,
    requirement_index,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }

    const params = [business_id, requirement_index];

    const [countsResult, requirementResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted_candidates,
           COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected_candidates,
           COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_candidates
         FROM prospect_discover.fit_score
         WHERE business_id = $1
           AND requirement_index = $2`,
        params
      ),
      pool.query(
        `SELECT req_index, clarified
         FROM prospect_discover.requirements
         WHERE business_id = $1
           AND req_index = $2`,
        params
      ),
    ]);

    return {
      stats: countsResult.rows[0],
      requirement: requirementResult.rows[0] ?? null,
    };
  },

  async getFindContactStatus({
    business_id,
    page = 1,
    limit = 25,
    search,
    status,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const MAX_LIMIT = 100;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * pageSize;

    const params = [business_id];
    const addParam = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    const listQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            fc.status
        FROM prospect_discover.find_contact_status fc
        JOIN prospect_discover.initial_candidates ic
            ON fc.place_id = ic.place_id
            AND fc.business_id = ic.business_id`;

    let filterWhere = 'WHERE fc.business_id = $1';

    if (search) {
      const pattern = addParam(`%${search}%`);
      filterWhere += ` AND (ic.company_name ILIKE ${pattern} OR ic.website ILIKE ${pattern})`;
    }

    if (status) {
      if (status === "success") {
        filterWhere += ` AND fc.status IN ('success', 'succeed')`;
      } else {
        filterWhere += ` AND fc.status = ${addParam(status)}`;
      }
    }

    const limitParam = addParam(pageSize);
    const offsetParam = addParam(offset);

    const [countResult, rowsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
         FROM prospect_discover.find_contact_status fc
         JOIN prospect_discover.initial_candidates ic
           ON fc.place_id = ic.place_id
          AND fc.business_id = ic.business_id
         ${filterWhere}`,
        params.slice(0, params.length - 2)
      ),
      pool.query(
        `${listQuery}
         ${filterWhere}
         ORDER BY ic.id ASC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params
      ),
    ]);

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  async getFindContactStatusDetail({ candidate_id, business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [business_id, candidate_id];

    const [statusInfoResult, emailsResult] = await Promise.all([
      pool.query(
        `SELECT
              ic.company_name,
              ic.website,
              COALESCE(fc.selected_page_no_email_miss, 0) AS selected_page_no_email_miss,
              COALESCE(fc.email_not_confident_miss, 0) AS email_not_confident_miss,
              fc.status,
              fc.final_stage,
              fc.reason,
              fc.fallback_from
          FROM prospect_discover.find_contact_status fc
          JOIN prospect_discover.initial_candidates ic
              ON fc.place_id = ic.place_id
              AND fc.business_id = ic.business_id
          WHERE ic.business_id = $1
            AND ic.id = $2`,
        params
      ),
      pool.query(
        `SELECT ec.email, ec.first_name, ec.last_name, ec.job_title, ec.linkedin_url,
                ec.contact_role, ec.from
         FROM prospect_discover.initial_candidates ic
         JOIN prospect_discover.email_contact ec
           ON ic.place_id = ec.place_id
          AND ic.business_id = ec.business_id
         WHERE ic.business_id = $1
           AND ic.id = $2`,
        params
      ),
    ]);

    if (statusInfoResult.rows.length === 0) {
      return null;
    }

    return {
      status_info: statusInfoResult.rows[0],
      emails: emailsResult.rows,
    };
  },

  async getFindContactStatusSummary({ business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total_candidates,
         COUNT(*) FILTER (WHERE status IN ('success', 'succeed'))::int AS success_candidates,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_candidates
       FROM prospect_discover.find_contact_status
       WHERE business_id = $1`,
      [business_id]
    );

    return rows[0];
  },

  async getFindContactStatusWorkflow({ business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS failed_candidates,
         final_stage
       FROM prospect_discover.find_contact_status
       WHERE business_id = $1
         AND status = 'failed'
       GROUP BY final_stage`,
      [business_id]
    );

    return {
      stages: rows.map((row) => ({
        final_stage: row.final_stage,
        failed_candidates: Number(row.failed_candidates),
      })),
    };
  },

  async getFindContactStageDetail({ business_id, final_stage }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!final_stage) {
      throw new Error('final_stage is required');
    }

    const { rows } = await pool.query(
      `SELECT ic.id, fc.reason, ic.company_name, ic.website
       FROM prospect_discover.find_contact_status fc
       JOIN prospect_discover.initial_candidates ic
         ON fc.place_id = ic.place_id
        AND fc.business_id = ic.business_id
       WHERE fc.business_id = $1
         AND fc.status = 'failed'
         AND fc.final_stage = $2
       ORDER BY ic.company_name`,
      [business_id, final_stage]
    );

    return rows;
  },

  async getOutReachStatus({
    business_id,
    page = 1,
    limit = 25,
    search,
    status,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const MAX_LIMIT = 100;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * pageSize;

    const params = [business_id];
    const addParam = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    const listQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            st.status AS final_status,
            hr.status AS human_review_status
        FROM prospect_discover.generate_outreach_status st
        JOIN prospect_discover.initial_candidates ic
            ON st.place_id = ic.place_id
            AND st.business_id = ic.business_id
        LEFT JOIN prospect_discover.human_review_compliance_check hr
            ON hr.business_id = st.business_id
            AND hr.place_id = st.place_id`;

    let filterWhere = 'WHERE st.business_id = $1';

    if (search) {
      const pattern = addParam(`%${search}%`);
      filterWhere += ` AND (ic.company_name ILIKE ${pattern} OR ic.website ILIKE ${pattern})`;
    }

    if (status) {
      if (status === "success") {
        filterWhere += ` AND st.status IN ('success', 'succeed')`;
      } else if (status === "review_required") {
        filterWhere += ` AND st.status IN ('review_required', 'require_review')`;
      } else if (status === "rejected") {
        filterWhere += ` AND st.status = 'rejected'`;
      } else if (status === "pending") {
        filterWhere += ` AND st.status = 'pending'`;
      } else {
        filterWhere += ` AND st.status = ${addParam(status)}`;
      }
    }

    const limitParam = addParam(pageSize);
    const offsetParam = addParam(offset);

    const [countResult, rowsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
         FROM prospect_discover.generate_outreach_status st
         JOIN prospect_discover.initial_candidates ic
           ON st.place_id = ic.place_id
          AND st.business_id = ic.business_id
         ${filterWhere}`,
        params.slice(0, params.length - 2)
      ),
      pool.query(
        `${listQuery}
         ${filterWhere}
         ORDER BY ic.id ASC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params
      ),
    ]);

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  async getOutreachStatusDetail({ candidate_id, business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [business_id, candidate_id];

    const [statusInfoResult, emailsResult, needReviewEmail] = await Promise.all([
      pool.query(
        `SELECT
              ic.company_name,
              ic.website,
              st.status,
              st.final_stage,
              st.reason,
              hr.status AS human_review_status,
              hr.modified,
              hr.analytic_status,
              hr.edit_severity
          FROM prospect_discover.generate_outreach_status st
          JOIN prospect_discover.initial_candidates ic
              ON st.place_id = ic.place_id
              AND st.business_id = ic.business_id
          LEFT JOIN prospect_discover.human_review_compliance_check hr
              ON hr.business_id = st.business_id
              AND hr.place_id = st.place_id
          WHERE ic.business_id = $1
            AND ic.id = $2`,
        params
      ),
      pool.query(
        `SELECT oe.email, oe.outreach_email
         FROM prospect_discover.initial_candidates ic
         JOIN prospect_discover.outreach_email oe
           ON ic.place_id = oe.place_id
          AND ic.business_id = oe.business_id
         WHERE ic.business_id = $1
           AND ic.id = $2`,
        params
      ),
      pool.query(
        `SELECT hr.reason, hr.issues, hr.email_text, hr.email_text_type
         FROM prospect_discover.initial_candidates ic
         JOIN prospect_discover.human_review_compliance_check hr
           ON ic.place_id = hr.place_id
          AND ic.business_id = hr.business_id
         WHERE ic.business_id = $1
           AND ic.id = $2`,
        params
      ),
    ]);

    if (statusInfoResult.rows.length === 0) {
      return null;
    }

    return {
      status_info: statusInfoResult.rows[0],
      emails: emailsResult.rows,
      need_review_emails: needReviewEmail.rows[0] ?? null
    };
  },

  async updateOutreachStatus({ candidate_id, business_id, action }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }
    if (action !== 'keep' && action !== 'discard') {
      throw new Error('action must be keep or discard');
    }

    const outreachStatus = action === 'keep' ? 'pending' : 'rejected';

    const result = await pool.query(
      `UPDATE prospect_discover.generate_outreach_status st
       SET status = $3
       FROM prospect_discover.initial_candidates ic
       WHERE st.place_id = ic.place_id
         AND st.business_id = ic.business_id
         AND ic.business_id = $1
         AND ic.id = $2`,
      [business_id, candidate_id, outreachStatus]
    );

    return { affectedRows: result.rowCount };
  },

  async getOutreachStatusSummary({ business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const [outreachResult, humanReviewResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (
             WHERE st.status IN ('success', 'succeed') AND hr.place_id IS NULL
           )::int AS success_candidates,
           COUNT(*) FILTER (
             WHERE st.status IN ('success', 'succeed')
           )::int AS total_success_candidates,
           COUNT(*) FILTER (WHERE st.status = 'failed')::int AS failed_candidates,
           COUNT(*) FILTER (
             WHERE st.status IN ('review_required', 'require_review')
           )::int AS require_review_candidates
         FROM prospect_discover.generate_outreach_status st
         LEFT JOIN prospect_discover.human_review_compliance_check hr
           ON hr.business_id = st.business_id
          AND hr.place_id = st.place_id
         WHERE st.business_id = $1`,
        [business_id]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (
             WHERE hr.status IN ('pending', 'approved', 'rejected')
           )::int AS total_review_candidates,
           COUNT(*) FILTER (WHERE hr.status = 'pending')::int AS pending_candidates,
           COUNT(*) FILTER (WHERE hr.status = 'approved')::int AS total_approved_candidates,
           COUNT(*) FILTER (WHERE hr.status = 'rejected')::int AS rejected_candidates,
           COUNT(*) FILTER (
             WHERE hr.status = 'approved' AND hr.modified = TRUE
           )::int AS modified_candidates,
           COUNT(*) FILTER (
             WHERE hr.status = 'approved'
               AND hr.modified = TRUE
               AND hr.analytic_status = 'success'
           )::int AS analyzed_candidates,
           COUNT(*) FILTER (
             WHERE hr.status = 'approved'
               AND hr.modified = TRUE
               AND hr.analytic_status = 'success'
               AND hr.edit_severity = 'major'
           )::int AS major_changed_candidates,
           COUNT(*) FILTER (
             WHERE hr.status = 'approved'
               AND hr.modified = TRUE
               AND hr.analytic_status = 'success'
               AND hr.edit_severity = 'minor'
           )::int AS minor_changed_candidates
         FROM prospect_discover.human_review_compliance_check hr
         WHERE hr.business_id = $1`,
        [business_id]
      ),
    ]);

    return {
      ...outreachResult.rows[0],
      ...humanReviewResult.rows[0],
    };
  },

  async getOutreachStatusWorkflow({ business_id }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS not_success_candidates,
         st.final_stage
       FROM prospect_discover.generate_outreach_status st
       WHERE st.business_id = $1
         AND st.status = 'failed'
       GROUP BY st.final_stage`,
      [business_id]
    );

    return {
      stages: rows.map((row) => ({
        final_stage: row.final_stage,
        not_success_candidates: Number(row.not_success_candidates),
      })),
    };
  },

  async getOutreachStageDetail({ business_id, final_stage }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!final_stage) {
      throw new Error('final_stage is required');
    }

    const { rows } = await pool.query(
      `SELECT ic.id, st.status, st.reason, ic.company_name, ic.website
       FROM prospect_discover.generate_outreach_status st
       JOIN prospect_discover.initial_candidates ic
         ON st.place_id = ic.place_id
        AND st.business_id = ic.business_id
       WHERE st.business_id = $1
         AND st.status = 'failed'
         AND st.final_stage = $2
       ORDER BY ic.company_name`,
      [business_id, final_stage]
    );

    return rows;
  },

};
