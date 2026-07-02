import { errorResponse, jsonResponse } from "@/lib/api/response";
import { N8nError, triggerN8nWebhook } from "@/lib/services/n8n";

type TriggerRequestBody = {
  workflow?: string;
  payload?: unknown;
  timeoutMs?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TriggerRequestBody;
    const { workflow, payload, timeoutMs } = body;

    if (!workflow) {
      return errorResponse("workflow is required", 400);
    }

    const result = await triggerN8nWebhook(workflow, payload ?? {}, {
      timeoutMs,
    });

    return jsonResponse({ result });
  } catch (error) {
    if (error instanceof N8nError) {
      return jsonResponse(
        { error: error.message, details: error.data },
        error.status
      );
    }

    if (error instanceof Error) {
      console.error("[n8n trigger]", error);
      return errorResponse(error.message, 500);
    }

    return errorResponse("Internal server error", 500);
  }
}
