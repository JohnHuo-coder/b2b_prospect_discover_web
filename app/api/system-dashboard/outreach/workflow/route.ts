import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type WorkflowStageRow = {
  final_stage: string;
  not_success_candidates: number | string;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const result = await systemDashboardRepository.getOutreachStatusWorkflow({
        business_id,
      });

      return jsonResponse({
        stages: (result.stages as WorkflowStageRow[]).map((row) => ({
          final_stage: row.final_stage,
          not_success_candidates: Number(row.not_success_candidates),
        })),
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/outreach/workflow]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
