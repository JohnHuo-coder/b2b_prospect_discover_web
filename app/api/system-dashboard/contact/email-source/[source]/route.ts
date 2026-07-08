import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

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
  withApproved(async (_request: Request, context: RouteContext, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const { source } = await context.params;

      if (source === "apollo") {
        const result = await systemDashboardRepository.getFindContactStatusApolloDetail({
          business_id,
        });
        return jsonResponse({
          items: mapStatusDetailRows(
            (result as { stages: StatusDetailRow[] }).stages ?? [],
            "status"
          ),
        });
      }

      if (source === "anymail") {
        const result =
          await systemDashboardRepository.getFindContactStatusAnymailDetail({
            business_id,
          });
        return jsonResponse({
          items: mapStatusDetailRows(
            (result as { stages: StatusDetailRow[] }).stages ?? [],
            "status"
          ),
        });
      }

      if (source === "website") {
        const result = await systemDashboardRepository.getFindContactStatusWebDetail({
          business_id,
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
