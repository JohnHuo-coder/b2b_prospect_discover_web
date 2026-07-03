import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import dashboardRepository from "@/server/repositories/dashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      const summary = await dashboardRepository.getDashboardSummary({
        business_id: user.business_id ?? undefined,
      });

      return jsonResponse(summary);
    } catch (error) {
      console.error("[GET /api/dashboard/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
