import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
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

export const POST = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const version = Number(user.config_version) || 0;
      if (version < 1) {
        return errorResponse("Configuration required before starting discovery", 400);
      }

      const result = await triggerN8nWebhook("start-discovery", {
        business_id: user.business_id,
        version,
      });

      const parsed = parseStartDiscoveryResponse(result);
      if (!parsed.accepted) {
        return errorResponse(START_DISCOVERY_FAILED_MESSAGE, 502);
      }

      return jsonResponse({
        status: "accepted",
        message: parsed.message,
      });
    } catch (error) {
      if (error instanceof N8nError) {
        console.error("[POST /api/dashboard/start-discovery]", error);
        return jsonResponse(
          { error: error.message, details: error.data },
          error.status
        );
      }

      console.error("[POST /api/dashboard/start-discovery]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
