import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type RouteContext = {
  params: Promise<{ source: string }>;
};

type StatusDetailRow = {
  status?: string | null;
  final_stage?: string | null;
  failed_candidates: number | string;
};

function mapStatusDetailRows(rows: StatusDetailRow[], labelKey: "status" | "final_stage") {
  return rows.map((row) => ({
    label: String(row[labelKey] ?? "unknown"),
    count: Number(row.failed_candidates),
  }));
}

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);
      const { source } = await context.params;

      if (source === "apollo") {
        if (!scope) {
          return jsonResponse({ items: [] });
        }

        const result = await systemDashboardRepository.getFindContactStatusApolloDetail({
          ...scope,
        });
        return jsonResponse({
          items: mapStatusDetailRows(
            (result as { stages: StatusDetailRow[] }).stages ?? [],
            "status"
          ),
        });
      }

      if (source === "anymail") {
        if (!scope) {
          return jsonResponse({ items: [] });
        }

        const result =
          await systemDashboardRepository.getFindContactStatusAnymailDetail({
            ...scope,
          });
        return jsonResponse({
          items: mapStatusDetailRows(
            (result as { stages: StatusDetailRow[] }).stages ?? [],
            "status"
          ),
        });
      }

      if (source === "website") {
        if (!scope) {
          return jsonResponse({ items: [] });
        }

        const result = await systemDashboardRepository.getFindContactStatusWebDetail({
          ...scope,
        });
        return jsonResponse({
          items: mapStatusDetailRows(
            (result as { stages: StatusDetailRow[] }).stages ?? [],
            "final_stage"
          ),
        });
      }

      return errorResponse("Invalid email source", 400);
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/contact/email-source/[source]]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
