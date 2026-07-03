import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

function parseRequiredNumber(value: unknown, field: string, min = 0, max = 100) {
  if (value === null || value === undefined || value === "") {
    return { error: `${field} is required` };
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return { error: `${field} must be a number` };
  }

  if (numeric < min || numeric > max) {
    return { error: `${field} must be between ${min} and ${max}` };
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

        const fitScore = parseRequiredNumber(body.fit_score_cutoff, "fit_score_cutoff");
        if ("error" in fitScore) return errorResponse(fitScore.error, 400);

        const lowConf = parseRequiredNumber(
          body.low_conf_cutoff_email_classification,
          "low_conf_cutoff_email_classification"
        );
        if ("error" in lowConf) return errorResponse(lowConf.error, 400);

        const qualifiedConf = parseRequiredNumber(
          body.qualified_conf_email_classification,
          "qualified_conf_email_classification"
        );
        if ("error" in qualifiedConf) return errorResponse(qualifiedConf.error, 400);

        const result = await businessRepository.upsertClassificationCutoffs({
          business_id: user.business_id,
          fit_score_cutoff: fitScore.value,
          low_conf_cutoff_email_classification: lowConf.value,
          qualified_conf_email_classification: qualifiedConf.value,
        });
        return jsonResponse(result);
      } catch (error) {
        console.error("[PATCH /api/business/config/cutoffs]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
