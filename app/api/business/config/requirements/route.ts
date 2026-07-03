import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

export const PATCH = withAuth(
  withApproved(
    withOwner(async (request: Request, _context: unknown, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const body = await request.json();

        if (!Array.isArray(body.requirements)) {
          return errorResponse("requirements must be an array", 400);
        }

        const requirements = body.requirements
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);

        const result = await businessRepository.upsertRequirements({
          business_id: user.business_id,
          requirements,
        });
        return jsonResponse(result);
      } catch (error) {
        console.error("[PATCH /api/business/config/requirements]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
