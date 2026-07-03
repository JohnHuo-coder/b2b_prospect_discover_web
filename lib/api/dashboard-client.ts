import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type DashboardSummary = {
  sent: number;
  heard_back: number;
  pending: number;
  rejected: number;
};

type DashboardSummaryResponse = {
  total_sent: number;
  total_heard_back: number;
  total_pending: number;
  total_rejected: number;
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await authenticatedFetch(ENDPOINTS.DASHBOARD_SUMMARY);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load dashboard summary"
    );
  }

  const data = (await response.json()) as DashboardSummaryResponse;

  return {
    sent: data.total_sent,
    heard_back: data.total_heard_back,
    pending: data.total_pending,
    rejected: data.total_rejected,
  };
}
