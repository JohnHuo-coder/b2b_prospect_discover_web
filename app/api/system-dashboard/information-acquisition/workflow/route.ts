import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type WorkflowStageRow = {
  final_stage: string;
  failed_candidates: number | string;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const { searchParams } = new URL(request.url);
      const requirementIndexParam = searchParams.get("requirement_index");

      if (!requirementIndexParam) {
        return errorResponse("requirement_index is required", 400);
      }

      const requirement_index = Number(requirementIndexParam);
      if (!Number.isFinite(requirement_index)) {
        return errorResponse("Invalid requirement_index", 400);
      }

      const result =
        await systemDashboardRepository.getInfoAcquisitionStatusWorkflowByReq({
          business_id,
          requirement_index,
        });

      return jsonResponse({
        requirement_index,
        requirement_text: result.requirement?.clarified ?? "",
        stages: (result.stages as WorkflowStageRow[]).map((row) => ({
          final_stage: row.final_stage,
          failed_candidates: Number(row.failed_candidates),
        })),
      });
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/information-acquisition/workflow]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
