import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
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
        business_id,
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
