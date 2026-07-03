import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const config = await businessRepository.getBusinessConfig(user.business_id);
      return jsonResponse(config);
    } catch (error) {
      console.error("[GET /api/business/config]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
