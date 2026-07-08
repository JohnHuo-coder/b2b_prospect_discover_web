import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ComplianceCheckDecisionPayload } from "@/lib/compliance-check/review-payload";

export async function submitHumanReviewComplianceDecision(
  candidateId: string,
  payload: ComplianceCheckDecisionPayload
): Promise<void> {
  const response = await authenticatedFetch(
    ENDPOINTS.humanReviewComplianceCheckDetail(candidateId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to save compliance review decision"
    );
  }
}

export async function submitOutreachComplianceDecision(
  candidateId: string,
  payload: ComplianceCheckDecisionPayload
): Promise<void> {
  const response = await authenticatedFetch(ENDPOINTS.outreachDetail(candidateId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to update outreach review decision"
    );
  }
}
