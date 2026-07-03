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
          search_keyword?: unknown;
          search_location?: unknown;
        };

        const search_keyword =
          typeof body.search_keyword === "string" ? body.search_keyword.trim() : "";
        const search_location =
          typeof body.search_location === "string" ? body.search_location.trim() : "";

        if (!search_keyword) {
          return errorResponse("search_keyword is required", 400);
        }

        if (!search_location) {
          return errorResponse("search_location is required", 400);
        }

        const result = await businessRepository.upsertSearchConfig({
          business_id: user.business_id,
          search_keyword,
          search_location,
        });
        return jsonResponse(result);
      } catch (error) {
        console.error("[PATCH /api/business/config/search]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
