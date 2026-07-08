import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type FitScoreSummaryRow = {
  total_candidates: number | string;
  accepted_candidates: number | string;
  rejected_candidates: number | string;
  failed_candidates: number | string;
};

function mapFitScoreCounts(row: FitScoreSummaryRow) {
  return {
    totalInput: Number(row.total_candidates),
    accepted: Number(row.accepted_candidates),
    rejected: Number(row.rejected_candidates),
    failed: Number(row.failed_candidates),
  };
}

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const { searchParams } = new URL(request.url);
      const requirementIndexParam = searchParams.get("requirement_index");

      if (requirementIndexParam) {
        const requirement_index = Number(requirementIndexParam);
        if (!Number.isFinite(requirement_index)) {
          return errorResponse("Invalid requirement_index", 400);
        }

        const result =
          await systemDashboardRepository.getFitScoreStatusSummaryByReq({
            business_id,
            requirement_index,
          });

        return jsonResponse({
          requirement_index,
          requirement_text: result.requirement?.clarified ?? "",
          ...mapFitScoreCounts(result.stats as FitScoreSummaryRow),
        });
      }

      const result = await systemDashboardRepository.getFitScoreStatusSummary({
        business_id,
      });

      return jsonResponse({
        overall: mapFitScoreCounts(result.overall as FitScoreSummaryRow),
        requirements: (result.requirements ?? []).map(
          (row: { req_index: number; clarified: string }) => ({
            requirement_index: row.req_index,
            requirement_text: row.clarified,
          })
        ),
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/fitscore/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
