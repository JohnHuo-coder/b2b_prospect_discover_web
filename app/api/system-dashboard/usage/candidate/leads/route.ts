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
      const { searchParams } = new URL(request.url);
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const configId = parseConfigId(searchParams.get("config_id"));
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "25";
      const search = searchParams.get("search")?.trim() || undefined;

      if (configId == null || Number.isNaN(configId)) {
        return errorResponse("config_id is required", 400);
      }

      const result = await usageRepository.getCandidateLevelLeads({
        business_id: user.business_id!,
        config_id: configId,
        page,
        limit,
        search,
      });

      if ("error" in result && result.error) {
        return errorResponse(result.error, 404);
      }

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/system-dashboard/usage/candidate/leads]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
