import { jsonResponse, errorResponse } from "@/lib/api/response";
import { formatProspectUsage } from "@/lib/constants/automation-jobs";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { resolveRequestedConfigVersion } from "@/server/providers/shared/dashboardVersionHelpers.js";
import automationJobRepository from "@/server/repositories/automationJobRepository.js";
import {
  assertStartDiscoveryN8nConfigured,
  scheduleStartDiscoveryN8nDispatch,
} from "@/lib/services/startDiscoveryN8n";

export { parseStartDiscoveryResponse } from "@/lib/services/startDiscoveryResponse";

type DbUser = {
  business_id?: number | string | null;
  config_version?: number | null;
};

export const maxDuration = 60;

export const START_DISCOVERY_FAILED_MESSAGE =
  "Failed to start discovery. Please try again later or contact your technical team.";

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
      if (version == null) {
        return errorResponse("Invalid version", 400);
      }

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

      try {
        assertStartDiscoveryN8nConfigured();
      } catch (configError) {
        console.error("[POST /api/dashboard/start-discovery] n8n not configured", {
          automationJobId,
          error: configError,
        });
        await automationJobRepository.updateAutomationJobStatus(
          automationJobId,
          "failed"
        );
        return errorResponse(
          "Automation is not configured. Please contact your technical team.",
          503
        );
      }

      console.info("[POST /api/dashboard/start-discovery] job reserved", {
        automationJobId,
        business_id: user.business_id,
        version,
      });

      scheduleStartDiscoveryN8nDispatch({
        automationJobId,
        business_id: user.business_id,
        version,
      });

      return jsonResponse({
        status: "accepted",
        automationJobId,
        ...buildDiscoveryResponseBody(
          "Discovery workflow started.",
          prospectUsage,
          runningJobs
        ),
      });
    } catch (error) {
      console.error("[POST /api/dashboard/start-discovery]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
