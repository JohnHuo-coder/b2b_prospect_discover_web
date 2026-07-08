import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type StageDetailRow = {
  id: number | string;
  reason: string | null;
  company_name: string;
  website: string | null;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const { searchParams } = new URL(request.url);
      const finalStage = searchParams.get("final_stage");

      if (!finalStage) {
        return errorResponse("final_stage is required", 400);
      }

      const rows = await systemDashboardRepository.getFindContactStageDetail({
        business_id,
        final_stage: finalStage,
      });

      return jsonResponse({
        final_stage: finalStage,
        candidates: (rows as StageDetailRow[]).map((row) => ({
          id: String(row.id),
          company: row.company_name,
          website: row.website,
          reason: row.reason ?? "",
        })),
      });
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/contact/workflow/stage]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
