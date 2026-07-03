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

        const body = (await request.json()) as {
          business_name?: unknown;
          sender_name?: unknown;
          collaboration_intent?: unknown;
        };

        const business_name =
          typeof body.business_name === "string" ? body.business_name.trim() : "";
        const collaboration_intent =
          typeof body.collaboration_intent === "string"
            ? body.collaboration_intent.trim()
            : "";
        const sender_name =
          typeof body.sender_name === "string" ? body.sender_name.trim() : "";

        if (!business_name) {
          return errorResponse("business_name is required", 400);
        }

        if (!collaboration_intent) {
          return errorResponse("collaboration_intent is required", 400);
        }

        const result = await businessRepository.upsertBusinessProfile({
          business_id: user.business_id,
          business_name,
          sender_name,
          collaboration_intent,
        });
        return jsonResponse(result);
      } catch (error) {
        console.error("[PATCH /api/business/config/profile]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
