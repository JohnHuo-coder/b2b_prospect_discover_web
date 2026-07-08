import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

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
  status: string;
  final_stage: string | null;
  reason: string | null;
  no_facts_extracted_miss: number;
  no_best_url_subset_miss: number;
};

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { candidateId } = await context.params;
      const business_id = user.business_id;

      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const rows = (await systemDashboardRepository.getInfoAcquisitionStatusDetail({
        business_id,
        candidate_id: candidateId,
      })) as InfoAcquisitionDetailRow[];

      if (rows.length === 0) {
        return errorResponse("Candidate not found", 404);
      }

      const overallStatus = rows.some((row) => row.status === "failed")
        ? "failed"
        : "success";

      return jsonResponse({
        id: candidateId,
        company_name: rows[0].company_name,
        website: rows[0].website,
        overall_status: overallStatus,
        requirements: rows.map((row) => ({
          requirement_index: row.requirement_index,
          requirement_text: row.requirement_text ?? "",
          has_url_no_web_content_miss: row.has_url_no_web_content_miss,
          insufficient_content_miss: row.insufficient_content_miss,
          status: row.status,
          final_stage: row.final_stage ?? "",
          reason: row.reason ?? "",
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
