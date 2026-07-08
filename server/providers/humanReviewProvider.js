import { pool } from '../../lib/db/client.ts';

export default {
    async getComlianceCheckAll({ business_id }) {
        if (!business_id) {
          throw new Error('business_id is required');
        }
    
        const [results, count] = await Promise.all([pool.query(
            `SELECT
                ic.id,
                ic.company_name,
                ic.website
              FROM prospect_discover.human_review_compliance_check hr
              JOIN prospect_discover.initial_candidates ic
                  ON hr.place_id = ic.place_id
                  AND hr.business_id = ic.business_id
              WHERE ic.business_id = $1`,
            [business_id]
        ),
        pool.query(
            `SELECT COUNT(*) AS total
              FROM prospect_discover.human_review_compliance_check hr
              WHERE hr.business_id = $1`,
            [business_id]
        )])
        return {
            rows: results.rows,
            total: Number(count.rows[0].total),
        }
    },

    async getComlianceCheckDetail({ candidate_id, business_id }) {
        if (!business_id) {
          throw new Error('business_id is required');
        }
        if (!candidate_id) {
            throw new Error('candidate id is required');
          }
    
        const [draft, facts] = await Promise.all([pool.query(
            `SELECT
                ic.id,
                ic.company_name,
                ic.website,
                hr.reason, 
                hr.issues,
                hr.email_text,
                hr.email_text_type
              FROM prospect_discover.human_review_compliance_check hr
              JOIN prospect_discover.initial_candidates ic
                  ON hr.place_id = ic.place_id
                  AND hr.business_id = ic.business_id
              WHERE ic.id = $1
                AND ic.business_id = $2`,
            [candidate_id, business_id]
        ),
        pool.query(
            `SELECT fi.req_ind, fi.facts, req.clarified AS requirement
              FROM prospect_discover.facts_inventory fi
              JOIN prospect_discover.initial_candidates ic
                ON fi.place_id = ic.place_id
                AND fi.business_id = ic.business_id
              LEFT JOIN prospect_discover.requirements req
                ON req.business_id = fi.business_id
                AND req.req_index = fi.req_ind
              WHERE ic.business_id = $1
                AND ic.id = $2 
              ORDER BY fi.req_ind ASC`,
            [business_id, candidate_id]
        )])
        return {
            draft: draft.rows[0],
            facts: facts.rows
        }
    },

    async getFactsByReq({ candidate_id, business_id, requirement_index }) {
        if (!business_id) {
          throw new Error('business_id is required');
        }
        if (!candidate_id) {
            throw new Error('candidate id is required');
        }
        if (requirement_index === null || requirement_index === undefined) {
            throw new Error('requirement index is required');
        }
    
        const [fact, requirement] = await Promise.all([pool.query(
            `SELECT fi.req_ind, fi.facts
              FROM prospect_discover.facts_inventory fi
              JOIN prospect_discover.initial_candidates ic
                ON fi.place_id = ic.place_id
                AND fi.business_id = ic.business_id
              WHERE ic.business_id = $1
                AND ic.id = $2 
                AND fi.req_ind = $3`,
            [business_id, candidate_id, requirement_index]
        ),
        pool.query(
            `SELECT clarified
              FROM prospect_discover.requirements req
              WHERE business_id = $1
              AND req_index = $2`,
            [business_id, requirement_index]
        )])
        return {
            fact: fact.rows[0],
            requirement: requirement.rows[0]
        }
    },

    async deleteComlianceCheckRecord({ candidate_id, business_id }) {
        if (!business_id) {
          throw new Error('business_id is required');
        }
        if (!candidate_id) {
            throw new Error('candidate id is required');
        }
    
        const { rowCount } = await pool.query(
            `DELETE FROM prospect_discover.human_review_compliance_check hr
             USING prospect_discover.initial_candidates ic
             WHERE hr.place_id = ic.place_id
               AND hr.business_id = ic.business_id
               AND ic.business_id = $1
               AND ic.id = $2`,
            [business_id, candidate_id]
        );

        return { affectedRows: rowCount };
    },

    


    async getEmailClassificationAll({ business_id }) {
        if (!business_id) {
          throw new Error('business_id is required');
        }
    
        const [results, count] = await Promise.all([pool.query(
            `SELECT
                ic.id,
                ic.company_name,
                ic.website
              FROM prospect_discover.human_review_email_classification hr
              JOIN prospect_discover.initial_candidates ic
                  ON hr.place_id = ic.place_id
                  AND hr.business_id = ic.business_id
              WHERE ic.business_id = $1
              GROUP BY ic.id, ic.company_name, ic.website
              ORDER BY ic.id ASC`,
            [business_id]
        ),
        pool.query(
            `SELECT COUNT(DISTINCT ic.id) AS total
              FROM prospect_discover.human_review_email_classification hr
              JOIN prospect_discover.initial_candidates ic
                ON hr.place_id = ic.place_id
                AND hr.business_id = ic.business_id
              WHERE hr.business_id = $1`,
            [business_id]
        )])
        return {
            rows: results.rows,
            total: Number(count.rows[0].total),
        }
    },

    async getEmailClassificationDetail({ candidate_id, business_id }) {
        if (!business_id) {
          throw new Error('business_id is required');
        }
        if (!candidate_id) {
            throw new Error('candidate id is required');
          }
    
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
            JOIN prospect_discover.initial_candidates ic
                ON hr.place_id = ic.place_id
                AND hr.business_id = ic.business_id
            WHERE ic.id = $1
                AND ic.business_id = $2
            ORDER BY hr.email ASC`,
            [candidate_id, business_id]
        );

        return rows;
    },
}