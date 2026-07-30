"use client";

import { formatProspectUsage } from "@/lib/constants/automation-jobs";
import type { DiscoveryQuota } from "@/lib/api/dashboard-client";

export function DiscoveryQuotaIndicator({
  quota,
  loading,
}: {
  quota: DiscoveryQuota | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="text-xs text-zinc-400" aria-busy="true">
        Loading quota...
      </p>
    );
  }

  if (!quota) {
    return null;
  }

  const usageLabel = formatProspectUsage(quota.prospectUsage);
  const runningLabel = `${quota.runningJobs.count}/${quota.runningJobs.limit} running`;

  return (
    <p className="text-xs text-zinc-500">
      <span className="font-medium text-zinc-700">{usageLabel}</span> prospects
      today (company-wide)
      <span className="mx-1.5 text-zinc-300">·</span>
      <span>{runningLabel}</span>
    </p>
  );
}
