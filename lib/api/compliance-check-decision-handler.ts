import { jsonResponse, errorResponse } from "@/lib/api/response";
import { submitComplianceCheckDecision } from "@/server/services/complianceCheckDecisionService.js";

type ComplianceCheckDecisionBody = {
  action?: string;
  original_outreach_email?: string;
  outreach_email?: string;
  email_text_type?: string;
  company_name?: string;
  compliance_reason?: string;
  modified?: boolean;
};

function parseDecisionBody(body: ComplianceCheckDecisionBody) {
  const action = body.action?.trim();

  if (action !== "keep" && action !== "discard") {
    return { error: "action must be keep or discard" as const };
  }

  return {
    action,
    original_outreach_email: String(body.original_outreach_email ?? ""),
    outreach_email: String(body.outreach_email ?? body.original_outreach_email ?? ""),
    email_text_type: String(body.email_text_type ?? ""),
    company_name: String(body.company_name ?? ""),
    compliance_reason: String(body.compliance_reason ?? ""),
    modified: Boolean(body.modified),
  };
}

export async function handleComplianceCheckDecisionPatch(
  request: Request,
  candidateId: string,
  business_id: number | string
) {
  const body = (await request.json()) as ComplianceCheckDecisionBody;
  const parsed = parseDecisionBody(body);

  if ("error" in parsed) {
    return errorResponse(parsed.error, 400);
  }

  const result = await submitComplianceCheckDecision({
    business_id,
    candidate_id: candidateId,
    ...parsed,
  });

  if (!result.affectedRows) {
    return errorResponse("Compliance check record not found", 404);
  }

  return jsonResponse({ success: true });
}
