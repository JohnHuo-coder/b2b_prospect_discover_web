import { jsonResponse, errorResponse } from "@/lib/api/response";
import {
  DAILY_PROSPECT_LIMIT,
  START_DISCOVERY_N8N_ERROR_MESSAGE,
  START_DISCOVERY_N8N_TIMEOUT_MS,
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

export const maxDuration = 60;

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

  if (status === "accepted") {
    return { accepted: true, message };
  }

  // n8n may return 2xx with an empty or differently shaped body when responding early.
  if (!record) {
    return { accepted: true, message };
  }

  return { accepted: false, message };
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

      const reservation = await automationJobRepository.reserveRunningAutomationJob({
        business_id: user.business_id,
        version,
      });

      if (!reservation.allowed) {
        const validationMessage =
          reservation.message ?? "Discovery cannot be started";
        return jsonResponse(
          {
            error: validationMessage,
            ...buildDiscoveryResponseBody(
              validationMessage,
              reservation.prospectUsage,
              reservation.runningJobs
            ),
          },
          429
        );
      }

      const automationJobId = reservation.automationJobId;
      const prospectUsage = reservation.prospectUsage;
      const runningJobs = reservation.runningJobs;

      if (!automationJobId) {
        return errorResponse("Failed to start discovery job", 500);
      }

      let result: unknown;
      try {
        console.info("[POST /api/dashboard/start-discovery] triggering n8n", {
          automationJobId,
          business_id: user.business_id,
          version,
        });

        result = await triggerN8nWebhook(
          "start-discovery",
          {
            business_id: user.business_id,
            version,
            automation_job_id: automationJobId,
          },
          { timeoutMs: START_DISCOVERY_N8N_TIMEOUT_MS }
        );
      } catch (error) {
        console.error("[POST /api/dashboard/start-discovery] n8n failed", {
          automationJobId,
          error,
        });
        await automationJobRepository.updateAutomationJobStatus(
          automationJobId,
          "failed"
        );
        throw error;
      }

      const parsed = parseStartDiscoveryResponse(result);

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
        const message =
          error.status === 504
            ? START_DISCOVERY_N8N_ERROR_MESSAGE
            : error.message || START_DISCOVERY_N8N_ERROR_MESSAGE;
        return jsonResponse(
          {
            error: message,
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
