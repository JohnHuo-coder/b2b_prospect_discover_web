import { pool } from '../../lib/db/client.ts';
import humanReviewRepository from '../repositories/humanReviewRepository.js';
import { triggerComplianceCheckContinue } from '../../lib/services/complianceCheckN8n.ts';
import {
  requireConfigScope,
  scopeParams,
  whereBusinessConfigScope,
} from '../providers/shared/configScopeHelpers.js';

export const COMPLIANCE_DECISION_CONFLICT_MESSAGE =
  'This compliance review was already handled by someone else. Refresh and try again.';

const REVIEW_REQUIRED_STATUSES = ['require_review', 'review_required'];

function normalizeEmailTextType(type) {
  const normalized = String(type ?? '').trim().toLowerCase().replace(/_/g, ' ');
  if (normalized === 'body') return 'body';
  if (normalized === 'full' || normalized === 'full email') return 'full';
  return String(type ?? '').trim();
}

export async function submitComplianceCheckDecision({
  business_id,
  version,
  candidate_id,
  action,
  original_outreach_email,
  outreach_email,
  email_text_type,
  company_name,
  compliance_reason,
  modified,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const updateResult = await humanReviewRepository.updateComplianceCheckDecision({
      candidate_id,
      business_id,
      version,
      action,
      modified,
      client,
    });

    if (!updateResult.affectedRows) {
      await client.query('ROLLBACK');
      return { affectedRows: 0, conflict: true };
    }

    const reviewRow = updateResult.rows?.[0];
    if (!reviewRow) {
      await client.query('ROLLBACK');
      return { affectedRows: 0 };
    }

    const scope = requireConfigScope({ business_id, version });
    const outreachStatus = action === 'keep' ? 'pending' : 'rejected';

    const outreachUpdate = await client.query(
      `UPDATE prospect_discover.generate_outreach_status st
       SET status = $4
       FROM prospect_discover.business_configs bc
       WHERE st.config_id = bc.id
         AND ${whereBusinessConfigScope()}
         AND st.config_id = $3
         AND st.place_id = $5
         AND LOWER(st.status) = ANY($6::text[])`,
      [
        ...scopeParams(scope),
        reviewRow.config_id,
        outreachStatus,
        reviewRow.place_id,
        REVIEW_REQUIRED_STATUSES,
      ]
    );

    if (!outreachUpdate.rowCount) {
      await client.query('ROLLBACK');
      return { affectedRows: 0, conflict: true };
    }

    await client.query('COMMIT');

    const webhookPayload = {
      config_id: reviewRow.config_id,
      place_id: reviewRow.place_id,
      original_outreach_email: String(original_outreach_email ?? ''),
      outreach_email: String(outreach_email ?? original_outreach_email ?? ''),
      email_text_type: normalizeEmailTextType(email_text_type),
      company_name: String(company_name ?? ''),
      decision: action,
      compliance_reason: String(compliance_reason ?? ''),
      ...(action === 'keep' ? { modified: Boolean(modified) } : {}),
    };

    try {
      await triggerComplianceCheckContinue(webhookPayload);
    } catch (error) {
      console.error('[compliance-check-continue] webhook failed', error);
    }

    return { affectedRows: updateResult.affectedRows };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
