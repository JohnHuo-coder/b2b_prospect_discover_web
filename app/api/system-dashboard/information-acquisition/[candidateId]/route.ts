import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type RouteContext = {
  params: Promise<{ candidateId: string }>;
};

type InfoAcquisitionDetailRow = {
  company_name: string;
  website: string | null;
  requirement_index: number | null;
  requirement_text: string | null;
  has_url_no_web_content_miss: number;
  insufficient_content_miss: number;
  status: string | null;
  final_stage: string | null;
  reason: string | null;
  google_review_status: string | null;
  google_review_sufficient: boolean | null;
  no_facts_extracted_miss: number;
  no_best_url_subset_miss: number;
};

type WebAcquisitionStatusRow = {
  company_name: string;
  website: string | null;
  status: string | null;
  final_stage: string | null;
  reason: string | null;
};

type InfoAcquisitionDetailResult = {
  info_result: InfoAcquisitionDetailRow[];
  web_acquisition_status: WebAcquisitionStatusRow | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Candidate not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const result = (await systemDashboardRepository.getInfoAcquisitionStatusDetail({
        ...scope,
        candidate_id: candidateId,
      })) as InfoAcquisitionDetailResult;

      const infoRows = result.info_result ?? [];
      const webAcquisitionStatus = result.web_acquisition_status ?? null;

      if (infoRows.length === 0 && !webAcquisitionStatus) {
        return errorResponse("Candidate not found", 404);
      }

      const companyName =
        webAcquisitionStatus?.company_name ?? infoRows[0]?.company_name ?? "";
      const website =
        webAcquisitionStatus?.website ?? infoRows[0]?.website ?? null;

      if (webAcquisitionStatus) {
        return jsonResponse({
          id: candidateId,
          company_name: companyName,
          website,
          overall_status: "failed" as const,
          detail_mode: "web_acquisition" as const,
          web_acquisition_status: {
            status: webAcquisitionStatus.status,
            final_stage: webAcquisitionStatus.final_stage ?? "",
            reason: webAcquisitionStatus.reason ?? "",
          },
          requirements: [],
        });
      }

      const overallStatus = infoRows.some((row) => row.status === "failed")
        ? "failed"
        : "success";

      return jsonResponse({
        id: candidateId,
        company_name: companyName,
        website,
        overall_status: overallStatus,
        detail_mode: "requirements" as const,
        web_acquisition_status: null,
        requirements: infoRows.map((row) => ({
          requirement_index: row.requirement_index,
          requirement_text: row.requirement_text ?? "",
          has_url_no_web_content_miss: row.has_url_no_web_content_miss,
          insufficient_content_miss: row.insufficient_content_miss,
          status: row.status,
          final_stage: row.final_stage ?? "",
          reason: row.reason ?? "",
          google_review_status: row.google_review_status,
          google_review_sufficient: row.google_review_sufficient,
          no_facts_extracted_miss: row.no_facts_extracted_miss,
          no_best_url_subset_miss: row.no_best_url_subset_miss,
        })),
      });
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/information-acquisition/[candidateId]]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
