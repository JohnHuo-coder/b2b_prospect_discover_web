import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse({ candidates: [], total: 0 });
      }

      const { searchParams } = new URL(request.url);
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "25";
      const search = searchParams.get("search")?.trim() || undefined;
      const statusParam = searchParams.get("status");
      const status =
        statusParam === "succeed"
          ? "success"
          : statusParam === "failed"
            ? "failed"
            : undefined;

      const result = await systemDashboardRepository.getInfoAcquisitionStatus({
        ...scope,
        page,
        limit,
        search,
        status,
      });

      return jsonResponse({
        candidates: result.rows,
        total: result.total,
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/information-acquisition]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
