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

type ContactStatusInfo = {
  company_name: string;
  website: string | null;
  selected_page_no_email_miss: number;
  email_not_confident_miss: number;
  status: string;
  final_stage: string | null;
  reason: string | null;
  fallback_from: string | null;
};

type ContactEmailRow = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  contact_role: string | null;
  from: string | null;
};

function mapContactStatus(status: string) {
  return status === "failed" ? "failed" : "succeed";
}

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

      const result = (await systemDashboardRepository.getFindContactStatusDetail({
        business_id,
        candidate_id: candidateId,
      })) as {
        status_info: ContactStatusInfo;
        emails: ContactEmailRow[];
      } | null;

      if (!result) {
        return errorResponse("Candidate not found", 404);
      }

      const info = result.status_info;

      return jsonResponse({
        id: candidateId,
        company_name: info.company_name,
        website: info.website,
        status: mapContactStatus(info.status),
        final_stage: info.final_stage ?? "",
        reason: info.reason ?? "",
        fallback_from: info.fallback_from,
        selected_page_no_email_miss: Number(info.selected_page_no_email_miss),
        email_not_confident_miss: Number(info.email_not_confident_miss),
        emails: (result.emails ?? []).map((row) => ({
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          job_title: row.job_title,
          linkedin_url: row.linkedin_url,
          contact_role: row.contact_role,
          from: row.from,
        })),
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/contact/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
