import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import usageRepository from "@/server/repositories/usageRepository.js";

function parseOptionalConfigId(raw: string | null): number | null {
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
      const configId = parseOptionalConfigId(searchParams.get("config_id"));
      if (Number.isNaN(configId)) {
        return errorResponse("Invalid config_id", 400);
      }

      const result = await usageRepository.getBusinessLevelUsage({
        business_id: user.business_id!,
        config_id: configId,
      });

      if ("error" in result && result.error) {
        return errorResponse(result.error, 404);
      }

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/system-dashboard/usage/business]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
