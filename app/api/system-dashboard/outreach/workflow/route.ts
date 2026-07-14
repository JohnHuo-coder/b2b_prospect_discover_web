import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type WorkflowStageRow = {
  final_stage: string;
  not_success_candidates: number | string;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse({ stages: [] });
      }

      const result = await systemDashboardRepository.getOutreachStatusWorkflow({
        ...scope,
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
