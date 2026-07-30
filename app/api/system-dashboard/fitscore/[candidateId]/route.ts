import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

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

export const GET = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const { searchParams } = new URL(request.url);
      const scope = getConfigScope(user, searchParams.get("version"));
      if (!scope) {
        return errorResponse("Candidate not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const requirementIndexParam = searchParams.get("requirement_index");

      if (!requirementIndexParam) {
        return errorResponse("requirement_index is required", 400);
      }

      const requirement_index = Number(requirementIndexParam);
      if (!Number.isFinite(requirement_index)) {
        return errorResponse("Invalid requirement_index", 400);
      }

      const rows = (await systemDashboardRepository.getFitScoreStatusDetail({
        ...scope,
        candidate_id: candidateId,
        requirement_index,
      })) as FitScoreDetailRow[];

      if (rows.length === 0) {
        return errorResponse("Candidate not found", 404);
      }

      const row = rows[0];

      return jsonResponse({
        id: candidateId,
        company_name: row.company_name,
        website: row.website,
        overall_status: row.status,
        requirements: rows.map((detailRow) => ({
          requirement_index: detailRow.requirement_index,
          requirement_text: detailRow.requirement_text ?? "",
          score: detailRow.score != null ? Number(detailRow.score) : null,
          reason: detailRow.reason ?? "",
          supporting_facts: detailRow.supporting_facts,
          status: detailRow.status,
        })),
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/fitscore/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
