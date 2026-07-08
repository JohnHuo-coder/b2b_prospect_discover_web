import { triggerN8nWebhook } from "@/lib/services/n8n";

export type ComplianceCheckContinuePayload = {
  business_id: number | string;
  place_id: string;
  original_outreach_email: string;
  outreach_email: string;
  email_text_type: string;
  company_name: string;
  decision: "keep" | "discard";
  compliance_reason: string;
  modified: boolean;
};

export async function triggerComplianceCheckContinue(
  payload: ComplianceCheckContinuePayload
) {
  return triggerN8nWebhook("webhook/compliance-check-continue", payload);
}
