import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type SummaryCountsRow = {
  total_candidates: number | string;
  success_candidates: number | string;
  failed_candidates: number | string;
};

type RequirementSummaryRow = SummaryCountsRow & {
  get_review_facts_success_candidates: number | string;
  review_facts_sufficient_candidates: number | string;
};

function mapCounts(row: SummaryCountsRow) {
  return {
    totalInput: Number(row.total_candidates),
    succeed: Number(row.success_candidates),
    failed: Number(row.failed_candidates),
  };
}

function mapRequirementSummary(row: RequirementSummaryRow) {
  const totalInput = Number(row.total_candidates);
  const succeed = Number(row.success_candidates);
  const failed = Number(row.failed_candidates);
  const passRatePool = succeed + failed;

  return {
    totalInput,
    succeed,
    failed,
    passRatePool,
    reviewFactsSuccess: Number(row.get_review_facts_success_candidates),
    reviewFactsSufficient: Number(row.review_facts_sufficient_candidates),
  };
}

type WebsiteUrlCollectionRow = {
  url_collection_failed: number | string;
};

function mapWebsiteUrlAcquisition(
  totalInput: number,
  row: WebsiteUrlCollectionRow
) {
  const failed = Number(row.url_collection_failed);
  const acquired = Math.max(totalInput - failed, 0);

  return {
    totalInput,
    acquired,
    failed,
  };
}

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);

      const { searchParams } = new URL(request.url);
      const requirementIndexParam = searchParams.get("requirement_index");

      if (requirementIndexParam) {
        const requirement_index = Number(requirementIndexParam);
        if (!Number.isFinite(requirement_index)) {
          return errorResponse("Invalid requirement_index", 400);
        }

        if (!scope) {
          return jsonResponse({
            requirement_index,
            requirement_text: "",
            totalInput: 0,
            succeed: 0,
            failed: 0,
            passRatePool: 0,
            reviewFactsSuccess: 0,
            reviewFactsSufficient: 0,
          });
        }

        const result =
          await systemDashboardRepository.getInfoAcquisitionStatusSummaryByReq({
            ...scope,
            requirement_index,
          });

        return jsonResponse({
          requirement_index,
          requirement_text: result.requirement?.clarified ?? "",
          ...mapRequirementSummary(result.stats as RequirementSummaryRow),
        });
      }

      if (!scope) {
        return jsonResponse({
          overall: { totalInput: 0, succeed: 0, failed: 0 },
          websiteUrlAcquisition: { totalInput: 0, acquired: 0, failed: 0 },
          requirements: [],
        });
      }

      const result = await systemDashboardRepository.getInfoAcquisitionStatusSummary({
        ...scope,
      });

      const overall = mapCounts(result.overall as SummaryCountsRow);

      return jsonResponse({
        overall,
        websiteUrlAcquisition: mapWebsiteUrlAcquisition(
          overall.totalInput,
          result.companyWebsiteUrl as WebsiteUrlCollectionRow
        ),
        requirements: (result.requirements ?? []).map(
          (row: { req_index: number; clarified: string }) => ({
            requirement_index: row.req_index,
            requirement_text: row.clarified,
          })
        ),
      });
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/information-acquisition/summary]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
