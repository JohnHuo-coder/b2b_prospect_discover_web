import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type SummaryCountsRow = {
  total_candidates: number | string;
  success_candidates: number | string;
  failed_candidates: number | string;
};

function mapCounts(row: SummaryCountsRow) {
  return {
    totalInput: Number(row.total_candidates),
    succeed: Number(row.success_candidates),
    failed: Number(row.failed_candidates),
  };
}

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const result = await systemDashboardRepository.getFindContactStatusSummary({
        business_id,
      });

      return jsonResponse(mapCounts(result as SummaryCountsRow));
    } catch (error) {
      console.error("[GET /api/system-dashboard/contact/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
