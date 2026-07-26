import { runAfterResponse } from "@/lib/services/runAfterResponse";
import { parseStartDiscoveryResponse } from "@/lib/services/startDiscoveryResponse";
import { START_DISCOVERY_N8N_TIMEOUT_MS } from "@/lib/constants/automation-jobs";
import { getN8nWebhookTarget, N8nError, triggerN8nWebhook } from "@/lib/services/n8n";
import automationJobRepository from "@/server/repositories/automationJobRepository.js";

export type StartDiscoveryN8nPayload = {
  automationJobId: number | string;
  business_id: number | string;
  version: number | string;
};

export function assertStartDiscoveryN8nConfigured() {
  if (!process.env.N8N_BASE_URL?.trim()) {
    throw new Error("Missing N8N_BASE_URL in environment variables");
  }
}

/** Fire start-discovery webhook after the HTTP response is sent (avoids Vercel timeouts). */
export function scheduleStartDiscoveryN8nDispatch(payload: StartDiscoveryN8nPayload) {
  runAfterResponse(async () => {
    // This entire block runs in the background (waitUntil), not in the critical path
    // that the user's browser waits on. n8n "Respond Immediately" only affects n8n's
    // HTTP reply once this fetch arrives — it does not help if we never reach this line
    // or if the main handler is blocked on DB pool / sync await.
    const target = getN8nWebhookTarget("start-discovery");

    console.info("[start-discovery] background n8n dispatch started", {
      automationJobId: payload.automationJobId,
      business_id: payload.business_id,
      version: payload.version,
      webhookUrl: target.url,
      hasApiKey: target.hasApiKey,
    });

    try {
      const result = await triggerN8nWebhook(
        "start-discovery",
        {
          business_id: payload.business_id,
          version: payload.version,
          automation_job_id: payload.automationJobId,
        },
        { timeoutMs: START_DISCOVERY_N8N_TIMEOUT_MS }
      );

      const parsed = parseStartDiscoveryResponse(result);

      if (!parsed.accepted) {
        console.error("[start-discovery] n8n rejected start", {
          automationJobId: payload.automationJobId,
          result,
        });
        await automationJobRepository.updateAutomationJobStatus(
          payload.automationJobId,
          "failed"
        );
        return;
      }

      console.info("[start-discovery] n8n accepted start", {
        automationJobId: payload.automationJobId,
        message: parsed.message,
      });
    } catch (error) {
      console.error("[start-discovery] background n8n dispatch failed", {
        automationJobId: payload.automationJobId,
        webhookUrl: target.url,
        hasApiKey: target.hasApiKey,
        error,
      });

      if (error instanceof N8nError) {
        console.error("[start-discovery] n8n error details", {
          status: error.status,
          data: error.data,
        });
      }

      await automationJobRepository.updateAutomationJobStatus(
        payload.automationJobId,
        "failed"
      );
    }
  });
}
