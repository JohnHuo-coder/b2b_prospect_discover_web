import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const GET = withAuth(
  withApproved(
    withOwner(async (_request: Request, _context: unknown, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const members = await businessRepository.getAllBusinessMember(
          user.business_id
        );

        return jsonResponse({ members });
      } catch (error) {
        console.error("[GET /api/admin/members]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
