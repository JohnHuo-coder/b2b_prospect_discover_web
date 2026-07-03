import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import leadRepository from "@/server/repositories/leadRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const { searchParams } = new URL(request.url);
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
        business_id: user.business_id ?? undefined,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/leads]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
