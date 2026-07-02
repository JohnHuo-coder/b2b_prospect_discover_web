const DEFAULT_TIMEOUT_MS = 120_000;

export class N8nError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "N8nError";
  }
}

type TriggerOptions = {
  timeoutMs?: number;
};

function getWebhookUrl(webhookPath: string) {
  const baseUrl = process.env.N8N_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing N8N_BASE_URL in environment variables");
  }

  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = webhookPath.replace(/^\//, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function buildHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = process.env.N8N_API_KEY;
  if (apiKey) {
    // Must match the header name configured in n8n Webhook → Authentication
    headers.Authorization = apiKey;
  }

  return headers;
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  return response.json() as Promise<unknown>;
}

/** POST to an n8n webhook and wait for the workflow response. */
export async function triggerN8nWebhook(
  webhookPath: string,
  payload: unknown = {},
  options: TriggerOptions = {}
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getWebhookUrl(webhookPath), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new N8nError(
        `n8n webhook failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new N8nError(`n8n webhook timed out after ${timeoutMs}ms`, 504);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
