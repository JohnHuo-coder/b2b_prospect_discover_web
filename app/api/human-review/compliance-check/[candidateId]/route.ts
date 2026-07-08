import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { handleComplianceCheckDecisionPatch } from "@/lib/api/compliance-check-decision-handler";
import humanReviewRepository from "@/server/repositories/humanReviewRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type RouteContext = {
  params: Promise<{ candidateId: string }>;
};

type ComplianceCheckDraftRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  reason: string | null;
  issues: unknown;
  email_text: string | null;
  email_text_type: string | null;
};

type FactsInventoryRow = {
  req_ind: number;
  facts: unknown;
  requirement: string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { candidateId } = await context.params;
      const business_id = user.business_id;

      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const result = (await humanReviewRepository.getComplianceCheckDetail({
        candidate_id: candidateId,
        business_id,
      })) as {
        draft: ComplianceCheckDraftRow | undefined;
        facts: FactsInventoryRow[];
      };

      if (!result.draft) {
        return errorResponse("Compliance check record not found", 404);
      }

      const draft = result.draft;

      return jsonResponse({
        id: String(draft.id),
        company_name: draft.company_name,
        website: draft.website,
        reason: draft.reason ?? "",
        issues: draft.issues ?? [],
        email_text: draft.email_text ?? "",
        email_text_type: draft.email_text_type ?? "",
        facts: (result.facts ?? []).map((row) => ({
          req_ind: row.req_ind,
          facts: row.facts,
          requirement: row.requirement ?? "",
        })),
      });
    } catch (error) {
      console.error("[GET /api/human-review/compliance-check/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);

export const PATCH = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { candidateId } = await context.params;
      const business_id = user.business_id;

      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      return handleComplianceCheckDecisionPatch(request, candidateId, business_id);
    } catch (error) {
      console.error("[PATCH /api/human-review/compliance-check/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
