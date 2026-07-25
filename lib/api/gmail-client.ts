import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type GmailConnectionStatus = {
  connected: boolean;
  email: string | null;
};

export async function fetchGmailStatus(): Promise<GmailConnectionStatus> {
  const response = await authenticatedFetch(ENDPOINTS.GMAIL_STATUS);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load Gmail status"
    );
  }

  return (await response.json()) as GmailConnectionStatus;
}

type GmailConnectOptions = {
  returnTo?: string;
  leadId?: string;
  contactEmail?: string;
  contactEmails?: string[];
  autoSend?: boolean;
  autoBulkSend?: boolean;
};

export async function startGmailConnect(options: GmailConnectOptions = {}) {
  const returnTo =
    options.returnTo ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/dashboard");

  const response = await authenticatedFetch(ENDPOINTS.GMAIL_CONNECT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      returnTo,
      leadId: options.leadId ?? null,
      contactEmail: options.contactEmail ?? null,
      contactEmails: options.contactEmails ?? null,
      autoSend: Boolean(options.autoSend),
      autoBulkSend: Boolean(options.autoBulkSend),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to start Gmail connection"
    );
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error("Failed to start Gmail connection");
  }

  window.location.href = data.url;
}
