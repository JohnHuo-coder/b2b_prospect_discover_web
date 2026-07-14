import { pool } from '../../lib/db/client.ts';
import {
  joinBusinessConfigOnConfigId,
  joinInitialCandidateOnConfigPlace,
  requireConfigScope,
  resolveConfigScope,
  scopeParams,
  whereBusinessConfigScope,
} from './shared/configScopeHelpers.js';

const joinBc = joinBusinessConfigOnConfigId;
const joinIc = joinInitialCandidateOnConfigPlace;
const whereBc = whereBusinessConfigScope;

const fitScoreOverallStatusCase = `
  CASE
    WHEN BOOL_OR(fs.status = 'failed') THEN 'failed'
    WHEN BOOL_OR(fs.status = 'rejected') THEN 'rejected'
    ELSE 'accepted'
  END AS overall_status`;

function requirementsForScopeQuery(extraWhere = '', extraParams = []) {
  return {
    sql: `SELECT req.req_index, req.clarified
          FROM prospect_discover.requirements req
          ${joinBc('req')}
          WHERE ${whereBc()}${extraWhere}`,
    params: extraParams,
  };
}

export default {
  async getInfoAcquisitionStatus({
    business_id,
    version,
    page = 1,
    limit = 25,
    search,
    status,
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

    const groupedQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            CASE
                WHEN BOOL_OR(st.status = 'failed' OR st.status IS NULL) THEN 'failed'
                ELSE 'success'
            END AS overall_status
        FROM prospect_discover.get_web_content_status st
        ${joinBc('st')}
        ${joinIc('st', 'ic')}
        WHERE ${whereBc()}
        GROUP BY
            st.config_id,
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

  async getInfoAcquisitionStatusDetail({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [...scopeParams(scope), candidate_id];

    const [infoResult, webAcquisitionStatus] = await Promise.all([
      pool.query(
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
              st.google_review_status,
              st.google_review_sufficient,
              COALESCE(st.no_facts_extracted_miss, 0) AS no_facts_extracted_miss,
              COALESCE(st.no_best_url_subset_miss, 0) AS no_best_url_subset_miss
          FROM prospect_discover.get_web_content_status st
          ${joinBc('st')}
          ${joinIc('st', 'ic')}
          LEFT JOIN prospect_discover.requirements req
            ON req.config_id = bc.id
           AND req.req_index = st.requirement_index
          WHERE ${whereBc()}
            AND ic.id = $3
          ORDER BY req.req_index ASC NULLS LAST`,
        params
      ),
      pool.query(
        `SELECT
            ic.company_name,
            ic.website,
            st.status,
            st.final_stage,
            st.reason
        FROM prospect_discover.collect_url_status st
        ${joinBc('st')}
        ${joinIc('st', 'ic')}
        WHERE ${whereBc()}
          AND ic.id = $3`,
        params
      ),
    ]);

    return {
      info_result: infoResult.rows,
      web_acquisition_status: webAcquisitionStatus.rows[0] ?? null,
    };
  },

  async getInfoAcquisitionStatusSummary({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return {
        overall: {
          total_candidates: 0,
          success_candidates: 0,
          failed_candidates: 0,
        },
        companyWebsiteUrl: { url_collection_failed: 0 },
        requirements: [],
      };
    }

    const params = scopeParams(scope);
    const reqQuery = requirementsForScopeQuery(' ORDER BY req.req_index ASC', params);

    const [overallResult, urlCollectionResult, requirementsResult] = await Promise.all([
      pool.query(
        `WITH grouped AS (
           SELECT
             ic.id,
             CASE
               WHEN BOOL_OR(st.status = 'failed' OR st.status IS NULL) THEN 'failed'
               ELSE 'success'
             END AS overall_status
           FROM prospect_discover.get_web_content_status st
           ${joinBc('st')}
           ${joinIc('st', 'ic')}
           WHERE ${whereBc()}
           GROUP BY st.config_id, st.place_id, ic.id
         )
         SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'success')::int AS success_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'failed')::int AS failed_candidates
         FROM grouped`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS url_collection_failed
         FROM prospect_discover.collect_url_status st
         ${joinBc('st')}
         WHERE ${whereBc()}`,
        params
      ),
      pool.query(reqQuery.sql, reqQuery.params),
    ]);

    return {
      overall: overallResult.rows[0],
      companyWebsiteUrl: urlCollectionResult.rows[0],
      requirements: requirementsResult.rows,
    };
  },

  async getInfoAcquisitionStatusSummaryByReq({
    business_id,
    version,
    requirement_index,
  }) {
    const scope = requireConfigScope({ business_id, version });
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }

    const params = [...scopeParams(scope), requirement_index];

    const [countsResult, requirementResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE st.status = 'success')::int AS success_candidates,
           COUNT(*) FILTER (WHERE st.google_review_status = 'success')::int AS get_review_facts_success_candidates,
           COUNT(*) FILTER (WHERE st.google_review_sufficient = TRUE)::int AS review_facts_sufficient_candidates,
           COUNT(*) FILTER (WHERE st.status = 'failed')::int AS failed_candidates
         FROM prospect_discover.get_web_content_status st
         ${joinBc('st')}
         WHERE ${whereBc()}
           AND st.requirement_index = $3`,
        params
      ),
      pool.query(
        `SELECT req.req_index, req.clarified
         FROM prospect_discover.requirements req
         ${joinBc('req')}
         WHERE ${whereBc()}
           AND req.req_index = $3`,
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
    version,
    requirement_index,
  }) {
    const scope = requireConfigScope({ business_id, version });
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }

    const params = [...scopeParams(scope), requirement_index];

    const [countsResult, requirementResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS failed_candidates,
           st.final_stage
         FROM prospect_discover.get_web_content_status st
         ${joinBc('st')}
         WHERE ${whereBc()}
           AND st.requirement_index = $3
           AND st.status = 'failed'
         GROUP BY st.final_stage`,
        params
      ),
      pool.query(
        `SELECT req.req_index, req.clarified
         FROM prospect_discover.requirements req
         ${joinBc('req')}
         WHERE ${whereBc()}
           AND req.req_index = $3`,
        params
      ),
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
    version,
    requirement_index,
    final_stage,
  }) {
    const scope = requireConfigScope({ business_id, version });
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }
    if (!final_stage) {
      throw new Error('final_stage is required');
    }

    const params = [...scopeParams(scope), requirement_index, final_stage];

    const { rows } = await pool.query(
      `SELECT ic.id, st.reason, ic.company_name, ic.website
       FROM prospect_discover.get_web_content_status st
       ${joinBc('st')}
       ${joinIc('st', 'ic')}
       WHERE ${whereBc()}
         AND st.requirement_index = $3
         AND st.status = 'failed'
         AND st.final_stage = $4
       ORDER BY ic.company_name`,
      params
    );

    return rows;
  },

  async getFitScoreStatus({
    business_id,
    version,
    page = 1,
    limit = 25,
    search,
    status,
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

    const groupedQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            ${fitScoreOverallStatusCase}
        FROM prospect_discover.fit_score fs
        ${joinBc('fs')}
        ${joinIc('fs', 'ic')}
        WHERE ${whereBc()}
        GROUP BY
            fs.config_id,
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

  async getFitScoreStatusDetail({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [...scopeParams(scope), candidate_id];

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
        ${joinBc('fs')}
        ${joinIc('fs', 'ic')}
        LEFT JOIN prospect_discover.requirements req
          ON req.config_id = bc.id
         AND req.req_index = fs.requirement_index
        WHERE ${whereBc()}
          AND ic.id = $3
        ORDER BY req.req_index ASC NULLS LAST`,
      params
    );

    return rows;
  },

  async getFitScoreStatusSummary({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return {
        overall: {
          total_candidates: 0,
          accepted_candidates: 0,
          rejected_candidates: 0,
          failed_candidates: 0,
        },
        requirements: [],
      };
    }

    const params = scopeParams(scope);
    const reqQuery = requirementsForScopeQuery(' ORDER BY req.req_index ASC', params);

    const [overallResult, requirementsResult] = await Promise.all([
      pool.query(
        `WITH grouped AS (
           SELECT
             ic.id,
             ${fitScoreOverallStatusCase}
           FROM prospect_discover.fit_score fs
           ${joinBc('fs')}
           ${joinIc('fs', 'ic')}
           WHERE ${whereBc()}
           GROUP BY fs.config_id, fs.place_id, ic.id
         )
         SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'accepted')::int AS accepted_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'rejected')::int AS rejected_candidates,
           COUNT(*) FILTER (WHERE overall_status = 'failed')::int AS failed_candidates
         FROM grouped`,
        params
      ),
      pool.query(reqQuery.sql, reqQuery.params),
    ]);

    return {
      overall: overallResult.rows[0],
      requirements: requirementsResult.rows,
    };
  },

  async getFitScoreStatusSummaryByReq({
    business_id,
    version,
    requirement_index,
  }) {
    const scope = requireConfigScope({ business_id, version });
    if (requirement_index == null) {
      throw new Error('requirement_index is required');
    }

    const params = [...scopeParams(scope), requirement_index];

    const [countsResult, requirementResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_candidates,
           COUNT(*) FILTER (WHERE fs.status = 'accepted')::int AS accepted_candidates,
           COUNT(*) FILTER (WHERE fs.status = 'rejected')::int AS rejected_candidates,
           COUNT(*) FILTER (WHERE fs.status = 'failed')::int AS failed_candidates
         FROM prospect_discover.fit_score fs
         ${joinBc('fs')}
         WHERE ${whereBc()}
           AND fs.requirement_index = $3`,
        params
      ),
      pool.query(
        `SELECT req.req_index, req.clarified
         FROM prospect_discover.requirements req
         ${joinBc('req')}
         WHERE ${whereBc()}
           AND req.req_index = $3`,
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
    version,
    page = 1,
    limit = 25,
    search,
    status,
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

    const listQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            fc.status,
            fc.apollo_status,
            fc.anymail_finder_status
        FROM prospect_discover.find_contact_status fc
        ${joinBc('fc')}
        ${joinIc('fc', 'ic')}`;

    let filterWhere = `WHERE ${whereBc()}`;

    if (search) {
      const pattern = addParam(`%${search}%`);
      filterWhere += ` AND (ic.company_name ILIKE ${pattern} OR ic.website ILIKE ${pattern})`;
    }

    if (status) {
      if (status === 'success') {
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
         ${joinBc('fc')}
         ${joinIc('fc', 'ic')}
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

  async getFindContactStatusDetail({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [...scopeParams(scope), candidate_id];

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
          ${joinBc('fc')}
          ${joinIc('fc', 'ic')}
          WHERE ${whereBc()}
            AND ic.id = $3`,
        params
      ),
      pool.query(
        `SELECT ec.email, ec.first_name, ec.last_name, ec.job_title, ec.linkedin_url,
                ec.contact_role, ec.from
         FROM prospect_discover.initial_candidates ic
         ${joinBc('ic')}
         JOIN prospect_discover.email_contact ec
           ON ec.config_id = ic.config_id
          AND ec.place_id = ic.place_id
         WHERE ${whereBc()}
           AND ic.id = $3`,
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

  async getFindContactStatusSummary({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return {
        total_candidates: 0,
        success_candidates: 0,
        success_apollo_candidates: 0,
        success_anymail_candidates: 0,
        failed_candidates: 0,
      };
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total_candidates,
         COUNT(*) FILTER (WHERE fc.status IN ('success', 'succeed'))::int AS success_candidates,
         COUNT(*) FILTER (WHERE fc.apollo_status IN ('success', 'succeed'))::int AS success_apollo_candidates,
         COUNT(*) FILTER (WHERE fc.anymail_finder_status IN ('success', 'succeed'))::int AS success_anymail_candidates,
         COUNT(*) FILTER (WHERE fc.status = 'failed')::int AS failed_candidates
       FROM prospect_discover.find_contact_status fc
       ${joinBc('fc')}
       WHERE ${whereBc()}`,
      scopeParams(scope)
    );

    return rows[0];
  },

  async getFindContactStatusApolloDetail({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { stages: [] };
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS failed_candidates,
         fc.apollo_status
       FROM prospect_discover.find_contact_status fc
       ${joinBc('fc')}
       WHERE ${whereBc()}
         AND COALESCE(fc.apollo_status, '') NOT IN ('success', 'succeed')
       GROUP BY fc.apollo_status
       ORDER BY failed_candidates DESC`,
      scopeParams(scope)
    );

    return {
      stages: rows.map((row) => ({
        status: row.apollo_status,
        failed_candidates: Number(row.failed_candidates),
      })),
    };
  },

  async getFindContactStatusAnymailDetail({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { stages: [] };
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS failed_candidates,
         fc.anymail_finder_status
       FROM prospect_discover.find_contact_status fc
       ${joinBc('fc')}
       WHERE ${whereBc()}
         AND COALESCE(fc.apollo_status, '') NOT IN ('success', 'succeed')
         AND COALESCE(fc.anymail_finder_status, '') NOT IN ('success', 'succeed')
       GROUP BY fc.anymail_finder_status
       ORDER BY failed_candidates DESC`,
      scopeParams(scope)
    );

    return {
      stages: rows.map((row) => ({
        status: row.anymail_finder_status,
        failed_candidates: Number(row.failed_candidates),
      })),
    };
  },

  async getFindContactStatusWebDetail({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { stages: [] };
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS failed_candidates,
         fc.final_stage
       FROM prospect_discover.find_contact_status fc
       ${joinBc('fc')}
       WHERE ${whereBc()}
         AND COALESCE(fc.apollo_status, '') NOT IN ('success', 'succeed')
         AND COALESCE(fc.anymail_finder_status, '') NOT IN ('success', 'succeed')
         AND COALESCE(fc.status, '') NOT IN ('success', 'succeed')
       GROUP BY fc.final_stage
       ORDER BY failed_candidates DESC`,
      scopeParams(scope)
    );

    return {
      stages: rows.map((row) => ({
        final_stage: row.final_stage,
        failed_candidates: Number(row.failed_candidates),
      })),
    };
  },

  async getOutReachStatus({
    business_id,
    version,
    page = 1,
    limit = 25,
    search,
    status,
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

    const listQuery = `
      SELECT
            ic.id,
            ic.company_name,
            ic.website,
            st.status AS final_status,
            hr.status AS human_review_status
        FROM prospect_discover.generate_outreach_status st
        ${joinBc('st')}
        ${joinIc('st', 'ic')}
        LEFT JOIN prospect_discover.human_review_compliance_check hr
          ON hr.config_id = st.config_id
         AND hr.place_id = st.place_id`;

    let filterWhere = `WHERE ${whereBc()}`;

    if (search) {
      const pattern = addParam(`%${search}%`);
      filterWhere += ` AND (ic.company_name ILIKE ${pattern} OR ic.website ILIKE ${pattern})`;
    }

    if (status) {
      if (status === 'success') {
        filterWhere += ` AND st.status IN ('success', 'succeed')`;
      } else if (status === 'review_required') {
        filterWhere += ` AND st.status IN ('review_required', 'require_review')`;
      } else if (status === 'rejected') {
        filterWhere += ` AND st.status = 'rejected'`;
      } else if (status === 'pending') {
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
         ${joinBc('st')}
         ${joinIc('st', 'ic')}
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

  async getOutreachStatusDetail({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [...scopeParams(scope), candidate_id];

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
          ${joinBc('st')}
          ${joinIc('st', 'ic')}
          LEFT JOIN prospect_discover.human_review_compliance_check hr
            ON hr.config_id = st.config_id
           AND hr.place_id = st.place_id
          WHERE ${whereBc()}
            AND ic.id = $3`,
        params
      ),
      pool.query(
        `SELECT oe.email, oe.outreach_email
         FROM prospect_discover.initial_candidates ic
         ${joinBc('ic')}
         JOIN prospect_discover.outreach_email oe
           ON oe.config_id = ic.config_id
          AND oe.place_id = ic.place_id
         WHERE ${whereBc()}
           AND ic.id = $3`,
        params
      ),
      pool.query(
        `SELECT hr.reason, hr.issues, hr.email_text, hr.email_text_type
         FROM prospect_discover.initial_candidates ic
         ${joinBc('ic')}
         JOIN prospect_discover.human_review_compliance_check hr
           ON hr.config_id = ic.config_id
          AND hr.place_id = ic.place_id
         WHERE ${whereBc()}
           AND ic.id = $3`,
        params
      ),
    ]);

    if (statusInfoResult.rows.length === 0) {
      return null;
    }

    return {
      status_info: statusInfoResult.rows[0],
      emails: emailsResult.rows,
      need_review_emails: needReviewEmail.rows[0] ?? null,
    };
  },

  async updateOutreachStatus({ candidate_id, business_id, version, action }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }
    if (action !== 'keep' && action !== 'discard') {
      throw new Error('action must be keep or discard');
    }

    const outreachStatus = action === 'keep' ? 'pending' : 'rejected';

    const result = await pool.query(
      `UPDATE prospect_discover.generate_outreach_status st
       SET status = $4
       FROM prospect_discover.initial_candidates ic,
            prospect_discover.business_configs bc
       WHERE st.config_id = bc.id
         AND ic.config_id = bc.id
         AND st.place_id = ic.place_id
         AND ${whereBc()}
         AND ic.id = $3`,
      [...scopeParams(scope), candidate_id, outreachStatus]
    );

    return { affectedRows: result.rowCount };
  },

  async getOutreachStatusSummary({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return {
        total_candidates: 0,
        success_candidates: 0,
        total_success_candidates: 0,
        failed_candidates: 0,
        require_review_candidates: 0,
        total_review_candidates: 0,
        pending_candidates: 0,
        total_approved_candidates: 0,
        rejected_candidates: 0,
        modified_candidates: 0,
        analyzed_candidates: 0,
        major_changed_candidates: 0,
        minor_changed_candidates: 0,
      };
    }

    const params = scopeParams(scope);

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
         ${joinBc('st')}
         LEFT JOIN prospect_discover.human_review_compliance_check hr
           ON hr.config_id = st.config_id
          AND hr.place_id = st.place_id
         WHERE ${whereBc()}`,
        params
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
         ${joinBc('hr')}
         WHERE ${whereBc()}`,
        params
      ),
    ]);

    return {
      ...outreachResult.rows[0],
      ...humanReviewResult.rows[0],
    };
  },

  async getOutreachStatusWorkflow({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { stages: [] };
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS not_success_candidates,
         st.final_stage
       FROM prospect_discover.generate_outreach_status st
       ${joinBc('st')}
       WHERE ${whereBc()}
         AND st.status = 'failed'
       GROUP BY st.final_stage`,
      scopeParams(scope)
    );

    return {
      stages: rows.map((row) => ({
        final_stage: row.final_stage,
        not_success_candidates: Number(row.not_success_candidates),
      })),
    };
  },

  async getOutreachStageDetail({ business_id, version, final_stage }) {
    const scope = requireConfigScope({ business_id, version });
    if (!final_stage) {
      throw new Error('final_stage is required');
    }

    const params = [...scopeParams(scope), final_stage];

    const { rows } = await pool.query(
      `SELECT ic.id, st.status, st.reason, ic.company_name, ic.website
       FROM prospect_discover.generate_outreach_status st
       ${joinBc('st')}
       ${joinIc('st', 'ic')}
       WHERE ${whereBc()}
         AND st.status = 'failed'
         AND st.final_stage = $3
       ORDER BY ic.company_name`,
      params
    );

    return rows;
  },
};
