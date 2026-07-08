import { pool } from '../../lib/db/client.ts';
import systemDashboardProvider from '../providers/systemDashboardProvider.js';
import { triggerComplianceCheckContinue } from '../../lib/services/complianceCheckN8n.ts';

function normalizeEmailTextType(type) {
  const normalized = String(type ?? '').trim().toLowerCase().replace(/_/g, ' ');
  if (normalized === 'body') return 'body';
  if (normalized === 'full' || normalized === 'full email') return 'full';
  return String(type ?? '').trim();
}

export async function submitComplianceCheckDecision({
  business_id,
  candidate_id,
  action,
  original_outreach_email,
  outreach_email,
  email_text_type,
  company_name,
  compliance_reason,
  modified,
}) {
  const updateResult = await systemDashboardProvider.updateOutreachStatus({
    business_id,
    candidate_id,
    action,
  });

  if (!updateResult.affectedRows) {
    return { affectedRows: 0 };
  }

  const { rows } = await pool.query(
    `SELECT ic.place_id
     FROM prospect_discover.initial_candidates ic
     WHERE ic.business_id = $1
       AND ic.id = $2`,
    [business_id, candidate_id]
  );

  if (rows.length === 0) {
    throw new Error('Candidate not found after status update');
  }

  const webhookPayload = {
    business_id,
    place_id: rows[0].place_id,
    original_outreach_email: String(original_outreach_email ?? ''),
    outreach_email: String(outreach_email ?? original_outreach_email ?? ''),
    email_text_type: normalizeEmailTextType(email_text_type),
    company_name: String(company_name ?? ''),
    decision: action,
    compliance_reason: String(compliance_reason ?? ''),
    modified: Boolean(modified),
  };

  try {
    await triggerComplianceCheckContinue(webhookPayload);
  } catch (error) {
    console.error('[compliance-check-continue] webhook failed', error);
  }

  return { affectedRows: updateResult.affectedRows };
}
