import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type StageDetailRow = {
  id: number | string;
  reason: string | null;
  company_name: string;
  website: string | null;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const { searchParams } = new URL(request.url);
      const requirementIndexParam = searchParams.get("requirement_index");
      const finalStage = searchParams.get("final_stage");

      if (!requirementIndexParam) {
        return errorResponse("requirement_index is required", 400);
      }
      if (!finalStage) {
        return errorResponse("final_stage is required", 400);
      }

      const requirement_index = Number(requirementIndexParam);
      if (!Number.isFinite(requirement_index)) {
        return errorResponse("Invalid requirement_index", 400);
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse({
          requirement_index,
          final_stage: finalStage,
          candidates: [],
        });
      }

      const rows = await systemDashboardRepository.getInfoAcquisitionStageDetail(
        {
          ...scope,
          requirement_index,
          final_stage: finalStage,
        }
      );

      return jsonResponse({
        requirement_index,
        final_stage: finalStage,
        candidates: (rows as StageDetailRow[]).map((row) => ({
          id: String(row.id),
          company: row.company_name,
          website: row.website,
          reason: row.reason ?? "",
          status: "failed" as const,
        })),
      });
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/information-acquisition/workflow/stage]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
