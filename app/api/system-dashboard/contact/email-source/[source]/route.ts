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

type InsufficientReasonRow = {
  reason: string;
  count: number | string;
};

type SufficiencySummaryRow = {
  total_candidates: number | string;
  sufficient_candidates: number | string;
  insufficient_candidates: number | string;
  insufficient_reasons?: InsufficientReasonRow[];
};

function mapStatusDetailRows(rows: StatusDetailRow[], labelKey: "status" | "final_stage") {
  return rows.map((row) => ({
    label: String(row[labelKey] ?? "unknown"),
    count: Number(row.failed_candidates),
  }));
}

function mapInsufficientReasonRows(rows: InsufficientReasonRow[]) {
  const insufficientTotal = rows.reduce((sum, row) => sum + Number(row.count), 0);

  return rows.map((row) => {
    const count = Number(row.count);
    return {
      label: row.reason,
      count,
      percentage:
        insufficientTotal > 0 ? Math.round((count / insufficientTotal) * 100) : 0,
    };
  });
}

function mapSufficiencyDetail(summary: SufficiencySummaryRow) {
  const total = Number(summary.total_candidates);
  const sufficient = Number(summary.sufficient_candidates);
  const insufficient = Number(summary.insufficient_candidates);

  return {
    total,
    sufficient,
    insufficient,
    sufficiencyRate: total > 0 ? Math.round((sufficient / total) * 100) : 0,
    insufficientReasons: mapInsufficientReasonRows(summary.insufficient_reasons ?? []),
  };
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
          return jsonResponse({
            items: [],
            sufficiency: mapSufficiencyDetail({
              total_candidates: 0,
              sufficient_candidates: 0,
              insufficient_candidates: 0,
              insufficient_reasons: [],
            }),
          });
        }

        const result = await systemDashboardRepository.getFindContactStatusWebDetail({
          ...scope,
        });

        return jsonResponse({
          items: mapStatusDetailRows(
            (result as { stages: StatusDetailRow[] }).stages ?? [],
            "final_stage"
          ),
          sufficiency: mapSufficiencyDetail(
            (result as { sufficiency: SufficiencySummaryRow }).sufficiency
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
