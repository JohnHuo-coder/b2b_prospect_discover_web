import { jsonResponse, errorResponse } from "@/lib/api/response";
import {
  DAILY_PROSPECT_LIMIT,
  formatProspectUsage,
} from "@/lib/constants/automation-jobs";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { resolveRequestedConfigVersion } from "@/server/providers/shared/dashboardVersionHelpers.js";
import automationJobRepository from "@/server/repositories/automationJobRepository.js";
import { N8nError, triggerN8nWebhook } from "@/lib/services/n8n";

type DbUser = {
  business_id?: number | string | null;
  config_version?: number | null;
};

export const START_DISCOVERY_FAILED_MESSAGE =
  "Failed to start discovery. Please try again later or contact your technical team.";

function extractStartDiscoveryRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  if (typeof record.status === "string") {
    return record;
  }

  if (record.result && typeof record.result === "object") {
    return extractStartDiscoveryRecord(record.result);
  }

  if (record.data && typeof record.data === "object") {
    return extractStartDiscoveryRecord(record.data);
  }

  return null;
}

export function parseStartDiscoveryResponse(data: unknown): {
  accepted: boolean;
  message: string;
} {
  const record = extractStartDiscoveryRecord(data);
  const status =
    typeof record?.status === "string" ? record.status.trim().toLowerCase() : "";
  const message =
    typeof record?.message === "string" && record.message.trim()
      ? record.message.trim()
      : "Discovery workflow started.";

  return {
    accepted: status === "accepted",
    message,
  };
}

function buildDiscoveryResponseBody(
  message: string,
  prospectUsage: { used: number; limit: number },
  runningJobs: { count: number; limit: number },
  extra: Record<string, unknown> = {}
) {
  return {
    message,
    prospectUsage,
    runningJobs,
    prospectUsageLabel: formatProspectUsage(prospectUsage),
    ...extra,
  };
}

export const POST = withAuth(
  withApproved(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const body = (await request.json().catch(() => ({}))) as {
        version?: number | string | null;
      };
      const resolved = resolveRequestedConfigVersion(user, body.version);

      if (!resolved.ok) {
        if (resolved.reason === "no_config") {
          return errorResponse("Configuration required before starting discovery", 400);
        }
        return errorResponse("Invalid version", 400);
      }

      const version = resolved.version;

      const validation = await automationJobRepository.validateStartDiscovery({
        business_id: user.business_id,
        version,
      });

      if (!validation.allowed) {
        const validationMessage =
          validation.message ?? "Discovery cannot be started";
        return jsonResponse(
          {
            error: validationMessage,
            ...buildDiscoveryResponseBody(
              validationMessage,
              validation.prospectUsage,
              validation.runningJobs
            ),
          },
          429
        );
      }

      const automationJobId =
        await automationJobRepository.createRunningAutomationJob({
          business_id: user.business_id,
          version,
        });

      const statsAfterInsert =
        await automationJobRepository.getDiscoveryJobStats(
          user.business_id,
          version
        );

      let result: unknown;
      try {
        result = await triggerN8nWebhook("start-discovery", {
          business_id: user.business_id,
          version,
          automation_job_id: automationJobId,
        });
      } catch (error) {
        await automationJobRepository.updateAutomationJobStatus(
          automationJobId,
          "failed"
        );
        throw error;
      }

      const parsed = parseStartDiscoveryResponse(result);
      const prospectUsage = statsAfterInsert.prospectUsage;
      const runningJobs = statsAfterInsert.runningJobs;

      if (!parsed.accepted) {
        await automationJobRepository.updateAutomationJobStatus(
          automationJobId,
          "failed"
        );

        return jsonResponse(
          {
            error: START_DISCOVERY_FAILED_MESSAGE,
            ...buildDiscoveryResponseBody(
              START_DISCOVERY_FAILED_MESSAGE,
              prospectUsage,
              runningJobs
            ),
          },
          502
        );
      }

      return jsonResponse({
        status: "accepted",
        automationJobId,
        ...buildDiscoveryResponseBody(
          parsed.message,
          prospectUsage,
          runningJobs
        ),
      });
    } catch (error) {
      if (error instanceof N8nError) {
        console.error("[POST /api/dashboard/start-discovery]", error);
        return jsonResponse(
          {
            error: error.message,
            prospectUsage: { used: 0, limit: DAILY_PROSPECT_LIMIT },
            runningJobs: { count: 0, limit: 2 },
          },
          error.status
        );
      }

      console.error("[POST /api/dashboard/start-discovery]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
