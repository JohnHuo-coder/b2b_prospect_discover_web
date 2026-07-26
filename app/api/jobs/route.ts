import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import automationJobRepository from "@/server/repositories/automationJobRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const { searchParams } = new URL(request.url);
      const page = searchParams.get("page") ?? "1";
      const limit = searchParams.get("limit") ?? "25";

      const result = await automationJobRepository.listAutomationJobsForBusiness(
        user.business_id,
        { page, limit }
      );

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/jobs]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
