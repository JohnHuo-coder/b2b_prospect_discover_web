import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { resolveRequestedConfigVersion } from "@/server/providers/shared/dashboardVersionHelpers.js";
import dashboardRepository from "@/server/repositories/dashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
  config_version?: number | null;
};

const emptySummary = {
  total_ready: 0,
  total_sent: 0,
  total_rejected: 0,
  total_heard_back: 0,
  total_pending: 0,
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const { searchParams } = new URL(request.url);
      const resolved = resolveRequestedConfigVersion(
        user,
        searchParams.get("version")
      );

      if (!resolved.ok) {
        if (resolved.reason === "no_config") {
          return jsonResponse(emptySummary);
        }
        return errorResponse("Invalid version", 400);
      }

      const summary = await dashboardRepository.getDashboardSummary({
        business_id: user.business_id,
        version: resolved.version,
      });

      return jsonResponse(summary);
    } catch (error) {
      console.error("[GET /api/dashboard/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
