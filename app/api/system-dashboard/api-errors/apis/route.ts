import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import apiErrorRepository from "@/server/repositories/apiErrorRepository.js";
import apiErrorProvider from "@/server/providers/apiErrorProvider.js";

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
      const workflowName = searchParams.get("workflow_name")?.trim();

      if (configId == null || Number.isNaN(configId)) {
        return errorResponse("config_id is required", 400);
      }
      if (!workflowName) {
        return errorResponse("workflow_name is required", 400);
      }

      const result = await apiErrorRepository.getApiErrorApiSummary({
        business_id: user.business_id!,
        config_id: configId,
        workflow_name: workflowName,
        solved_filter: apiErrorProvider.parseSolvedFilter(
          searchParams.get("solved_filter")
        ),
      });

      if ("error" in result && result.error) {
        return errorResponse(result.error, 404);
      }

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/system-dashboard/api-errors/apis]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
