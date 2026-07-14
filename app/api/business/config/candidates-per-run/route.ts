import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

function parseInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return null;
  return numeric;
}

export const PATCH = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const body = (await request.json()) as Record<string, unknown>;
      const number_of_candidates_per_run = parseInteger(
        body.number_of_candidates_per_run
      );

      if (number_of_candidates_per_run === null || number_of_candidates_per_run < 1) {
        return errorResponse(
          "number_of_candidates_per_run must be a positive integer",
          400
        );
      }

      const result = await businessRepository.updateCandidatesPerRun({
        business_id: user.business_id,
        number_of_candidates_per_run,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error("[PATCH /api/business/config/candidates-per-run]", error);

      if (error instanceof Error) {
        if (error.message === "Configuration required before setting candidates per run") {
          return errorResponse(error.message, 400);
        }
        if (error.message === "Business config not found") {
          return errorResponse(error.message, 404);
        }
      }

      return errorResponse("Internal server error", 500);
    }
  })
);
