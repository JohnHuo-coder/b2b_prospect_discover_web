import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import usageRepository from "@/server/repositories/usageRepository.js";

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const result = await usageRepository.getCandidateLevelSummary({
        business_id: user.business_id!,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/system-dashboard/usage/candidate/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
