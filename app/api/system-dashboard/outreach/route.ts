import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  mapOutreachDbStatus,
  mapOutreachFilterToDb,
  shouldShowHumanApprovedTag,
} from "@/lib/system-dashboard/outreach-status";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type OutreachListRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  final_status: string;
  human_review_status: string | null;
};

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const { searchParams } = new URL(request.url);
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "25";
      const search = searchParams.get("search")?.trim() || undefined;
      const statusParam = searchParams.get("status");
      const status =
        statusParam === "succeed" ||
        statusParam === "failed" ||
        statusParam === "require_review" ||
        statusParam === "pending" ||
        statusParam === "rejected"
          ? mapOutreachFilterToDb(statusParam)
          : undefined;

      const result = await systemDashboardRepository.getOutReachStatus({
        business_id,
        page,
        limit,
        search,
        status,
      });

      return jsonResponse({
        candidates: (result.rows as OutreachListRow[]).map((row) => ({
          id: row.id,
          company_name: row.company_name,
          website: row.website,
          status: mapOutreachDbStatus(row.final_status),
          human_approved_tag: shouldShowHumanApprovedTag(
            row.final_status,
            row.human_review_status
          ),
        })),
        total: result.total,
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/outreach]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
