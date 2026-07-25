import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import type {
  ProspectUsage,
  RunningJobsUsage,
} from "@/lib/constants/automation-jobs";

export type DashboardSummary = {
  ready: number;
  sent: number;
  heard_back: number;
  pending: number;
  rejected: number;
};

type DashboardSummaryResponse = {
  total_ready: number;
  total_sent: number;
  total_heard_back: number;
  total_pending: number;
  total_rejected: number;
};

export type DiscoveryQuota = {
  prospectUsage: ProspectUsage;
  runningJobs: RunningJobsUsage;
};

export type StartDiscoveryResult = {
  status: "accepted";
  message: string;
  prospectUsage: ProspectUsage;
  runningJobs: RunningJobsUsage;
  prospectUsageLabel: string;
};

type StartDiscoveryResponse = {
  status?: string;
  message?: string;
  error?: string;
  prospectUsage?: ProspectUsage;
  runningJobs?: RunningJobsUsage;
  prospectUsageLabel?: string;
};

function parseDiscoveryQuota(data: unknown): DiscoveryQuota | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const prospectUsage = record.prospectUsage;
  const runningJobs = record.runningJobs;

  if (
    !prospectUsage ||
    typeof prospectUsage !== "object" ||
    !runningJobs ||
    typeof runningJobs !== "object"
  ) {
    return null;
  }

  const usage = prospectUsage as Record<string, unknown>;
  const running = runningJobs as Record<string, unknown>;

  return {
    prospectUsage: {
      used: Number(usage.used) || 0,
      limit: Number(usage.limit) || 200,
    },
    runningJobs: {
      count: Number(running.count) || 0,
      limit: Number(running.limit) || 2,
    },
  };
}

export async function fetchDashboardSummary(
  version?: number
): Promise<DashboardSummary> {
  const query =
    version !== undefined ? `?version=${encodeURIComponent(String(version))}` : "";
  const response = await authenticatedFetch(
    `${ENDPOINTS.DASHBOARD_SUMMARY}${query}`
  );

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
    ready: data.total_ready,
    sent: data.total_sent,
    heard_back: data.total_heard_back,
    pending: data.total_pending,
    rejected: data.total_rejected,
  };
}

export async function fetchDiscoveryQuota(): Promise<DiscoveryQuota> {
  const response = await authenticatedFetch(ENDPOINTS.DASHBOARD_DISCOVERY_QUOTA);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load discovery quota"
    );
  }

  const data = await response.json();
  const parsed = parseDiscoveryQuota(data);
  if (!parsed) {
    throw new Error("Invalid discovery quota response");
  }

  return parsed;
}

export async function startProspectDiscovery(
  version?: number
): Promise<StartDiscoveryResult> {
  const response = await authenticatedFetch(ENDPOINTS.DASHBOARD_START_DISCOVERY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      version !== undefined ? { version } : {}
    ),
  });

  const data = (await response.json().catch(() => ({}))) as StartDiscoveryResponse;
  const prospectUsage = parseDiscoveryQuota(data)?.prospectUsage ?? {
    used: 0,
    limit: 200,
  };
  const runningJobs = parseDiscoveryQuota(data)?.runningJobs ?? {
    count: 0,
    limit: 2,
  };

  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : "Failed to start discovery. Please try again later or contact your technical team.";
    const error = new Error(message) as Error & {
      prospectUsage?: ProspectUsage;
      runningJobs?: RunningJobsUsage;
      prospectUsageLabel?: string;
    };
    error.prospectUsage = prospectUsage;
    error.runningJobs = runningJobs;
    error.prospectUsageLabel =
      typeof data.prospectUsageLabel === "string"
        ? data.prospectUsageLabel
        : `${prospectUsage.used}/${prospectUsage.limit}`;
    throw error;
  }

  if (data.status !== "accepted") {
    throw new Error(
      "Failed to start discovery. Please try again later or contact your technical team."
    );
  }

  return {
    status: "accepted",
    message:
      typeof data.message === "string" && data.message.trim()
        ? data.message.trim()
        : "Discovery workflow started.",
    prospectUsage,
    runningJobs,
    prospectUsageLabel:
      typeof data.prospectUsageLabel === "string"
        ? data.prospectUsageLabel
        : `${prospectUsage.used}/${prospectUsage.limit}`,
  };
}
