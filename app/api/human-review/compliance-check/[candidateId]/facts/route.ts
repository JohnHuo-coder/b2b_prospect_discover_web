import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import humanReviewRepository from "@/server/repositories/humanReviewRepository.js";

type RouteContext = {
  params: Promise<{ candidateId: string }>;
};

export const GET = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Facts not found for requirement", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const { searchParams } = new URL(request.url);
      const requirementIndexParam = searchParams.get("requirement_index");

      if (!requirementIndexParam) {
        return errorResponse("requirement_index is required", 400);
      }

      const requirement_index = Number(requirementIndexParam);
      if (Number.isNaN(requirement_index)) {
        return errorResponse("requirement_index must be a number", 400);
      }

      const result = (await humanReviewRepository.getFactsByReq({
        ...scope,
        candidate_id: candidateId,
        requirement_index,
      })) as {
        fact?: { req_ind: number; facts: unknown };
        requirement?: { clarified: string | null };
      };

      if (!result.fact) {
        return errorResponse("Facts not found for requirement", 404);
      }

      return jsonResponse({
        req_ind: result.fact.req_ind,
        facts: result.fact.facts,
        requirement: result.requirement?.clarified ?? "",
      });
    } catch (error) {
      console.error(
        "[GET /api/human-review/compliance-check/[candidateId]/facts]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
