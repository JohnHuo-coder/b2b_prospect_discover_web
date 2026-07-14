import { pool } from '../../lib/db/client.ts';
import {
  joinBusinessConfigOnConfigId,
  joinInitialCandidateOnConfigPlace,
  joinRequirementsOnConfig,
  requireConfigScope,
  resolveConfigScope,
  scopeParams,
  whereBusinessConfigScope,
} from './shared/configScopeHelpers.js';
import { MERGED_FACTS_INVENTORY_EXPR } from './shared/factsInventoryHelpers.js';

const joinIc = joinInitialCandidateOnConfigPlace;
const joinBc = joinBusinessConfigOnConfigId;
const whereBc = whereBusinessConfigScope;

export default {
  async getComlianceCheckAll({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { rows: [], total: 0 };
    }

    const params = scopeParams(scope);

    const [results, count] = await Promise.all([
      pool.query(
        `SELECT
            ic.id,
            ic.company_name,
            ic.website
          FROM prospect_discover.human_review_compliance_check hr
          ${joinBc('hr')}
          ${joinIc('hr')}
          WHERE ${whereBc()}
          ORDER BY ic.id ASC`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) AS total
          FROM prospect_discover.human_review_compliance_check hr
          ${joinBc('hr')}
          WHERE ${whereBc()}`,
        params
      ),
    ]);

    return {
      rows: results.rows,
      total: Number(count.rows[0].total),
    };
  },

  async getComlianceCheckDetail({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [...scopeParams(scope), candidate_id];

    const [draft, facts] = await Promise.all([
      pool.query(
        `SELECT
            ic.id,
            ic.company_name,
            ic.website,
            hr.reason,
            hr.issues,
            hr.email_text,
            hr.email_text_type
          FROM prospect_discover.human_review_compliance_check hr
          ${joinBc('hr')}
          ${joinIc('hr')}
          WHERE ${whereBc()}
            AND ic.id = $3`,
        params
      ),
      pool.query(
        `SELECT fi.req_ind, ${MERGED_FACTS_INVENTORY_EXPR} AS facts, req.clarified AS requirement
          FROM prospect_discover.facts_inventory fi
          ${joinBc('fi')}
          ${joinIc('fi')}
          LEFT JOIN prospect_discover.requirements req
            ON req.config_id = bc.id
           AND req.req_index = fi.req_ind
          WHERE ${whereBc()}
            AND ic.id = $3
          ORDER BY fi.req_ind ASC`,
        params
      ),
    ]);

    return {
      draft: draft.rows[0],
      facts: facts.rows,
    };
  },

  async getFactsByReq({ candidate_id, business_id, version, requirement_index }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }
    if (requirement_index === null || requirement_index === undefined) {
      throw new Error('requirement index is required');
    }

    const params = [...scopeParams(scope), candidate_id, requirement_index];

    const [fact, requirement] = await Promise.all([
      pool.query(
        `SELECT fi.req_ind, ${MERGED_FACTS_INVENTORY_EXPR} AS facts
          FROM prospect_discover.facts_inventory fi
          ${joinBc('fi')}
          ${joinIc('fi')}
          WHERE ${whereBc()}
            AND ic.id = $3
            AND fi.req_ind = $4`,
        params
      ),
      pool.query(
        `SELECT req.clarified
          FROM prospect_discover.requirements req
          ${joinBc('req')}
          WHERE ${whereBc()}
            AND req.req_index = $3`,
        [...scopeParams(scope), requirement_index]
      ),
    ]);

    return {
      fact: fact.rows[0],
      requirement: requirement.rows[0],
    };
  },

  async deleteComlianceCheckRecord({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const { rowCount } = await pool.query(
      `DELETE FROM prospect_discover.human_review_compliance_check hr
       USING prospect_discover.initial_candidates ic,
             prospect_discover.business_configs bc
       WHERE hr.config_id = bc.id
         AND ic.config_id = bc.id
         AND hr.place_id = ic.place_id
         AND ${whereBc()}
         AND ic.id = $3`,
      [...scopeParams(scope), candidate_id]
    );

    return { affectedRows: rowCount };
  },

  async getEmailClassificationAll({ business_id, version }) {
    const scope = resolveConfigScope({ business_id, version });
    if (!scope) {
      return { rows: [], total: 0 };
    }

    const params = scopeParams(scope);

    const [results, count] = await Promise.all([
      pool.query(
        `SELECT
            ic.id,
            ic.company_name,
            ic.website
          FROM prospect_discover.human_review_email_classification hr
          ${joinBc('hr')}
          ${joinIc('hr')}
          WHERE ${whereBc()}
          GROUP BY ic.id, ic.company_name, ic.website
          ORDER BY ic.id ASC`,
        params
      ),
      pool.query(
        `SELECT COUNT(DISTINCT ic.id) AS total
          FROM prospect_discover.human_review_email_classification hr
          ${joinBc('hr')}
          ${joinIc('hr')}
          WHERE ${whereBc()}`,
        params
      ),
    ]);

    return {
      rows: results.rows,
      total: Number(count.rows[0].total),
    };
  },

  async getEmailClassificationDetail({ candidate_id, business_id, version }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }

    const params = [...scopeParams(scope), candidate_id];

    const { rows } = await pool.query(
      `SELECT
          ic.id,
          ic.company_name,
          ic.website,
          hr.email,
          hr.confidence_score,
          hr.from_context,
          hr.from_url,
          hr.reason,
          hr.likely_job_title,
          hr.likely_contact_first_name,
          hr.likely_contact_last_name,
          hr.contact_role
        FROM prospect_discover.human_review_email_classification hr
        ${joinBc('hr')}
        ${joinIc('hr')}
        WHERE ${whereBc()}
          AND ic.id = $3
        ORDER BY hr.email ASC`,
      params
    );

    return rows;
  },
};
