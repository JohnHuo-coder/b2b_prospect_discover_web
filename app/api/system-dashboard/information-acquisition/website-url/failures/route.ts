import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { getConfigScope, type DbUserWithConfig } from "@/lib/api/server-config-scope";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type FailureBreakdownRow = {
  final_stage: string;
  reason: string;
  count: number | string;
};

type StageBreakdown = {
  final_stage: string;
  count: number;
  percentage: number;
  reasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
};

function buildStageBreakdown(rows: FailureBreakdownRow[]): {
  totalFailed: number;
  stages: StageBreakdown[];
} {
  const totalFailed = rows.reduce((sum, row) => sum + Number(row.count), 0);
  const stageMap = new Map<string, StageBreakdown>();

  for (const row of rows) {
    const count = Number(row.count);
    const stageKey = row.final_stage;
    const existing = stageMap.get(stageKey);

    const reasonEntry = {
      reason: row.reason,
      count,
      percentage:
        totalFailed > 0 ? Math.round((count / totalFailed) * 100) : 0,
    };

    if (existing) {
      existing.count += count;
      existing.reasons.push(reasonEntry);
    } else {
      stageMap.set(stageKey, {
        final_stage: stageKey,
        count,
        percentage:
          totalFailed > 0 ? Math.round((count / totalFailed) * 100) : 0,
        reasons: [reasonEntry],
      });
    }
  }

  const stages = Array.from(stageMap.values())
    .map((stage) => ({
      ...stage,
      percentage:
        totalFailed > 0
          ? Math.round((stage.count / totalFailed) * 100)
          : 0,
      reasons: stage.reasons.sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count);

  return { totalFailed, stages };
}

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);

      if (!scope) {
        return jsonResponse({
          totalFailed: 0,
          stages: [],
        });
      }

      const result =
        await systemDashboardRepository.getCollectUrlStatusFailureBreakdown({
          ...scope,
        });

      const breakdown = buildStageBreakdown(
        (result.rows ?? []) as FailureBreakdownRow[]
      );

      return jsonResponse(breakdown);
    } catch (error) {
      console.error(
        "[GET /api/system-dashboard/information-acquisition/website-url/failures]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
