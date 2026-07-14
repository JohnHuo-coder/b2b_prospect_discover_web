import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import { computeContactEmailSourceBreakdown } from "@/lib/system-dashboard/contact-status";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type SummaryCountsRow = {
  total_candidates?: number | string;
  success_candidates?: number | string;
  success_apollo_candidates?: number | string;
  success_anymail_candidates?: number | string;
  failed_candidates?: number | string;
};

function safeCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(count, 0) : 0;
}

function mapCounts(row: SummaryCountsRow) {
  const totalInput = safeCount(row.total_candidates);
  const succeed = safeCount(row.success_candidates);
  const successApollo = safeCount(row.success_apollo_candidates);
  const successAnymail = safeCount(row.success_anymail_candidates);

  return {
    totalInput,
    succeed,
    failed: safeCount(row.failed_candidates),
    successApollo,
    successAnymail,
    emailSources: computeContactEmailSourceBreakdown({
      totalInput,
      succeed,
      successApollo,
      successAnymail,
    }),
  };
}

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse(
          mapCounts({
            total_candidates: 0,
            success_candidates: 0,
            success_apollo_candidates: 0,
            success_anymail_candidates: 0,
            failed_candidates: 0,
          })
        );
      }

      const result = await systemDashboardRepository.getFindContactStatusSummary({
        ...scope,
      });

      return jsonResponse(mapCounts(result as SummaryCountsRow));
    } catch (error) {
      console.error("[GET /api/system-dashboard/contact/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
