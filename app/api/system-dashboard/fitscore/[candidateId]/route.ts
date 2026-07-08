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

type FitScoreDetailRow = {
  company_name: string;
  website: string | null;
  requirement_index: number | null;
  requirement_text: string | null;
  score: number | string | null;
  reason: string | null;
  supporting_facts: unknown;
  status: string;
};

function computeOverallStatus(rows: FitScoreDetailRow[]) {
  if (rows.some((row) => row.status === "failed")) return "failed";
  if (rows.some((row) => row.status === "rejected")) return "rejected";
  return "accepted";
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

      const rows = (await systemDashboardRepository.getFitScoreStatusDetail({
        business_id,
        candidate_id: candidateId,
      })) as FitScoreDetailRow[];

      if (rows.length === 0) {
        return errorResponse("Candidate not found", 404);
      }

      return jsonResponse({
        id: candidateId,
        company_name: rows[0].company_name,
        website: rows[0].website,
        overall_status: computeOverallStatus(rows),
        requirements: rows.map((row) => ({
          requirement_index: row.requirement_index,
          requirement_text: row.requirement_text ?? "",
          score: row.score != null ? Number(row.score) : null,
          reason: row.reason ?? "",
          supporting_facts: row.supporting_facts,
          status: row.status,
        })),
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/fitscore/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
