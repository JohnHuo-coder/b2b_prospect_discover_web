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
            AND LOWER(hr.status) = 'pending'
          ORDER BY ic.id ASC`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) AS total
          FROM prospect_discover.human_review_compliance_check hr
          ${joinBc('hr')}
          WHERE ${whereBc()}
            AND LOWER(hr.status) = 'pending'`,
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
            AND ic.id = $3
            AND LOWER(hr.status) = 'pending'`,
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

  async updateComplianceCheckDecision({
    candidate_id,
    business_id,
    version,
    action,
    modified,
    client = pool,
  }) {
    const scope = requireConfigScope({ business_id, version });
    if (!candidate_id) {
      throw new Error('candidate id is required');
    }
    if (action !== 'keep' && action !== 'discard') {
      throw new Error('action must be keep or discard');
    }

    const params = [...scopeParams(scope), candidate_id];
    const pendingFilter = `AND LOWER(hr.status) = 'pending'`;

    if (action === 'keep') {
      params.push(Boolean(modified));
      const modifiedParam = params.length;

      const { rowCount, rows } = await client.query(
        `UPDATE prospect_discover.human_review_compliance_check hr
         SET status = 'approved',
             modified = $${modifiedParam}
         FROM prospect_discover.initial_candidates ic,
              prospect_discover.business_configs bc
         WHERE hr.config_id = bc.id
           AND ic.config_id = bc.id
           AND hr.place_id = ic.place_id
           AND ${whereBc()}
           AND ic.id = $3
           ${pendingFilter}
         RETURNING hr.config_id, hr.place_id`,
        params
      );

      return { affectedRows: rowCount, rows };
    }

    const { rowCount, rows } = await client.query(
      `UPDATE prospect_discover.human_review_compliance_check hr
       SET status = 'rejected'
       FROM prospect_discover.initial_candidates ic,
            prospect_discover.business_configs bc
       WHERE hr.config_id = bc.id
         AND ic.config_id = bc.id
         AND hr.place_id = ic.place_id
         AND ${whereBc()}
         AND ic.id = $3
         ${pendingFilter}
       RETURNING hr.config_id, hr.place_id`,
      params
    );

    return { affectedRows: rowCount, rows };
  },
};
