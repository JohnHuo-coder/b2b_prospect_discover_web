import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import {
  getContactEmailSource,
  type ContactEmailSource,
} from "@/lib/system-dashboard/contact-status";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type ContactListRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  status: string;
  apollo_status: string | null;
  anymail_finder_status: string | null;
};

function mapContactStatus(status: string) {
  return status === "failed" ? "failed" : "succeed";
}

export const GET = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse({ candidates: [], total: 0 });
      }

      const { searchParams } = new URL(request.url);
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "25";
      const search = searchParams.get("search")?.trim() || undefined;
      const statusParam = searchParams.get("status");
      const status =
        statusParam === "succeed"
          ? "success"
          : statusParam === "failed"
            ? "failed"
            : undefined;

      const result = await systemDashboardRepository.getFindContactStatus({
        ...scope,
        page,
        limit,
        search,
        status,
      });

      return jsonResponse({
        candidates: (result.rows as ContactListRow[]).map((row) => {
          const status = mapContactStatus(row.status);

          return {
            id: row.id,
            company_name: row.company_name,
            website: row.website,
            status,
            email_source: getContactEmailSource(
              row.status,
              row.apollo_status,
              row.anymail_finder_status
            ),
          };
        }),
        total: result.total,
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/contact]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
