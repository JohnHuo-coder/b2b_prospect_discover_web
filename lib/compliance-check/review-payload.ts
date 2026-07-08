export type ComplianceCheckReviewAction = "keep" | "discard";

export type ComplianceCheckEmailState = {
  originalOutreachEmail: string;
  outreachEmail: string;
  emailModified: boolean;
  isEditingEmail: boolean;
};

export type ComplianceCheckDecisionPayload = {
  action: ComplianceCheckReviewAction;
  original_outreach_email: string;
  outreach_email: string;
  email_text_type: string;
  company_name: string;
  compliance_reason: string;
  modified: boolean;
};

export function buildComplianceCheckDecisionPayload(
  detail: {
    company: string;
    reason: string;
    email_text_type: string;
  },
  emailState: ComplianceCheckEmailState,
  action: ComplianceCheckReviewAction
): ComplianceCheckDecisionPayload {
  return {
    action,
    original_outreach_email: emailState.originalOutreachEmail,
    outreach_email: emailState.outreachEmail,
    email_text_type: detail.email_text_type,
    company_name: detail.company,
    compliance_reason: detail.reason,
    modified: emailState.emailModified,
  };
}
