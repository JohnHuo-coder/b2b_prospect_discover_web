import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import apiErrorRepository from "@/server/repositories/apiErrorRepository.js";

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const result = await apiErrorRepository.listApiErrorConfigs({
        business_id: user.business_id!,
        current_version: Number(user.config_version) || 0,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/system-dashboard/api-errors/configs]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
