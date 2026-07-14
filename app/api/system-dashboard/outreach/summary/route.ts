import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import { safeSummaryCount } from "@/lib/system-dashboard/outreach-status";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type SummaryCountsRow = {
  total_candidates?: number | string;
  success_candidates?: number | string;
  total_success_candidates?: number | string;
  failed_candidates?: number | string;
  require_review_candidates?: number | string;
  pending_candidates?: number | string;
  total_review_candidates?: number | string;
  total_approved_candidates?: number | string;
  rejected_candidates?: number | string;
  modified_candidates?: number | string;
  analyzed_candidates?: number | string;
  major_changed_candidates?: number | string;
  minor_changed_candidates?: number | string;
};

function mapCounts(row: SummaryCountsRow) {
  const humanReviewTotal = safeSummaryCount(row.total_review_candidates);
  const humanReviewApproved = safeSummaryCount(row.total_approved_candidates);
  const humanReviewPending = safeSummaryCount(row.pending_candidates);
  const humanReviewRejected = safeSummaryCount(row.rejected_candidates);
  const modifiedCandidates = safeSummaryCount(row.modified_candidates);
  const analyzedCandidates = safeSummaryCount(row.analyzed_candidates);
  const majorChangedCandidates = safeSummaryCount(row.major_changed_candidates);
  const minorChangedCandidates = safeSummaryCount(row.minor_changed_candidates);

  return {
    totalInput: safeSummaryCount(row.total_candidates),
    succeed: safeSummaryCount(row.success_candidates),
    totalSucceed: safeSummaryCount(
      row.total_success_candidates ?? row.success_candidates
    ),
    failed: safeSummaryCount(row.failed_candidates),
    requireReview: safeSummaryCount(
      row.require_review_candidates ?? row.pending_candidates
    ),
    humanReviewTotal,
    humanReviewPending,
    humanReviewApproved,
    humanReviewRejected,
    modifiedCandidates,
    analyzedCandidates,
    majorChangedCandidates,
    minorChangedCandidates,
    approvedWithoutModification: Math.max(
      humanReviewApproved - modifiedCandidates,
      0
    ),
  };
}

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse(mapCounts({}));
      }

      const result = await systemDashboardRepository.getOutreachStatusSummary({
        ...scope,
      });

      return jsonResponse(mapCounts(result as SummaryCountsRow));
    } catch (error) {
      console.error("[GET /api/system-dashboard/outreach/summary]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
