import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import automationJobProvider from "@/server/providers/automationJobProvider.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const stats = await automationJobProvider.getBusinessDiscoveryQuota(
        user.business_id
      );

      return jsonResponse(stats);
    } catch (error) {
      console.error("[GET /api/dashboard/discovery-quota]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
