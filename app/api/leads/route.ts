import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { resolveRequestedConfigVersion } from "@/server/providers/shared/dashboardVersionHelpers.js";
import leadRepository from "@/server/repositories/leadRepository.js";

type DbUser = {
  business_id?: number | string | null;
  config_version?: number | null;
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
          return jsonResponse({ rows: [], total: 0 });
        }
        return errorResponse("Invalid version", 400);
      }

      const search = searchParams.get("search") || undefined;
      const statusParam = searchParams.get("status");
      const status =
        statusParam && statusParam !== "all" ? statusParam : undefined;
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "25";

      const result = await leadRepository.getLeads({
        search,
        status,
        page,
        limit,
        business_id: user.business_id,
        version: resolved.version,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/leads]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
