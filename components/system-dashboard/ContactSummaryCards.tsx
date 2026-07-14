"use client";

import { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import {
  fetchContactSummary,
  type ContactSummaryStats,
} from "@/lib/api/system-dashboard-client";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { MetricCard } from "./MetricCard";

const emptyStats: ContactSummaryStats = {
  totalInput: 0,
  succeed: 0,
  failed: 0,
  successApollo: 0,
  successAnymail: 0,
  emailSources: {
    apollo: { rate: 0, found: 0, total: 0 },
    anymailFinder: { rate: 0, found: 0, total: 0 },
    emailFromWebsite: { rate: 0, found: 0, total: 0 },
  },
};

export function ContactSummaryCards() {
  const [stats, setStats] = useState<ContactSummaryStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchContactSummary();
        if (!cancelled) setStats(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load summary"
          );
          setStats(emptyStats);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const { totalInput, succeed } = stats;
  const passRate =
    totalInput > 0 ? Math.round((succeed / totalInput) * 100) : 0;

  if (loading) {
    return (
      <div className="mb-6 max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="mt-3 h-9 w-20" />
          <SkeletonBar className="mt-4 h-2 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="max-w-md">
        <MetricCard
          label="Pass Rate"
          value={`${passRate}%`}
          progress={passRate}
          subtext={`${succeed} of ${totalInput}`}
          icon={Percent}
          iconClassName="text-violet-600"
          iconBoxClassName="bg-violet-100"
          valueClassName="text-violet-600"
          progressClassName="bg-violet-500"
        />
      </div>
    </div>
  );
}
