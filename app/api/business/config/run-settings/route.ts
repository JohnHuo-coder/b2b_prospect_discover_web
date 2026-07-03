import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

function parseRequiredPositiveInteger(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") {
    return { error: `${field} is required` };
  }

  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) {
    return { error: `${field} must be a positive integer` };
  }

  return { value: numeric };
}

export const PATCH = withAuth(
  withApproved(
    withOwner(async (request: Request, _context: unknown, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const body = (await request.json()) as Record<string, unknown>;

        const minWords = parseRequiredPositiveInteger(body.min_words, "min_words");
        if ("error" in minWords) return errorResponse(minWords.error, 400);

        const maxWords = parseRequiredPositiveInteger(body.max_words, "max_words");
        if ("error" in maxWords) return errorResponse(maxWords.error, 400);

        const candidates = parseRequiredPositiveInteger(
          body.number_of_candidates_per_run,
          "number_of_candidates_per_run"
        );
        if ("error" in candidates) return errorResponse(candidates.error, 400);

        if (minWords.value >= maxWords.value) {
          return errorResponse("max_words must be greater than min_words", 400);
        }

        const result = await businessRepository.upsertRunSettings({
          business_id: user.business_id,
          min_words: minWords.value,
          max_words: maxWords.value,
          number_of_candidates_per_run: candidates.value,
        });
        return jsonResponse(result);
      } catch (error) {
        console.error("[PATCH /api/business/config/run-settings]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
