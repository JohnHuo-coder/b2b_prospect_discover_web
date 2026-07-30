import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import usageRepository from "@/server/repositories/usageRepository.js";

function parseConfigId(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NaN;
  }
  return parsed;
}

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const { searchParams } = new URL(request.url);
      const configId = parseConfigId(searchParams.get("config_id"));
      const stage = searchParams.get("stage")?.trim();

      if (configId == null || Number.isNaN(configId)) {
        return errorResponse("config_id is required", 400);
      }
      if (!stage) {
        return errorResponse("stage is required", 400);
      }

      const result = await usageRepository.getCandidateLevelStageDetail({
        business_id: user.business_id!,
        config_id: configId,
        stage,
      });

      if ("error" in result && result.error) {
        return errorResponse(result.error, 404);
      }

      return jsonResponse(result);
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/usage/candidate/stages/detail]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
