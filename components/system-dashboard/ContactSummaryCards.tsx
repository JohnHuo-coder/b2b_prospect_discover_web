"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Percent, XCircle } from "lucide-react";
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

  const { totalInput, succeed, failed } = stats;
  const passRate =
    totalInput > 0 ? Math.round((succeed / totalInput) * 100) : 0;

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="mt-3 h-9 w-20" />
            <SkeletonBar className="mt-4 h-2 w-full" />
          </div>
        ))}
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <MetricCard
          label="Pass Rate"
          value={`${passRate}%`}
          progress={passRate}
          subtext={`${passRate}% passed · ${totalInput} total input`}
          icon={Percent}
          iconClassName="text-violet-600"
          iconBoxClassName="bg-violet-100"
          valueClassName="text-violet-600"
          progressClassName="bg-violet-500"
        />
        <MetricCard
          label="Succeed"
          value={succeed}
          subtext="Candidates that found contact successfully"
          icon={CheckCircle2}
          iconClassName="text-emerald-600"
          iconBoxClassName="bg-emerald-100"
          valueClassName="text-emerald-600"
        />
        <MetricCard
          label="Failed"
          value={failed}
          subtext="Candidates that failed contact discovery"
          icon={XCircle}
          iconClassName="text-red-600"
          iconBoxClassName="bg-red-100"
          valueClassName="text-red-600"
        />
      </div>
    </div>
  );
}
