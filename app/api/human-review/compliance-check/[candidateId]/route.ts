import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { handleComplianceCheckDecisionPatch } from "@/lib/api/compliance-check-decision-handler";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import humanReviewRepository from "@/server/repositories/humanReviewRepository.js";

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
  withApproved(async (_request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Compliance check record not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const result = (await humanReviewRepository.getComplianceCheckDetail({
        ...scope,
        candidate_id: candidateId,
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
  withApproved(async (request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Compliance check record not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      return handleComplianceCheckDecisionPatch(
        request,
        candidateId,
        scope.business_id,
        scope.version
      );
    } catch (error) {
      console.error("[PATCH /api/human-review/compliance-check/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
