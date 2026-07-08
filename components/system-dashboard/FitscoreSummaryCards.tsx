"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Percent,
  XCircle,
} from "lucide-react";
import {
  fetchFitscoreRequirementSummary,
  fetchFitscoreSummary,
  type FitscoreSummaryScope,
  type FitscoreSummaryStats,
} from "@/lib/api/system-dashboard-client";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { MetricCard } from "./MetricCard";

function computeFitscoreRates(stats: FitscoreSummaryStats) {
  const nonFailed = stats.totalInput - stats.failed;

  return {
    nonFailed,
    successRate:
      stats.totalInput > 0
        ? Math.round((nonFailed / stats.totalInput) * 100)
        : 0,
    acceptanceRate:
      nonFailed > 0 ? Math.round((stats.accepted / nonFailed) * 100) : 0,
  };
}

const emptyStats: FitscoreSummaryStats = {
  totalInput: 0,
  accepted: 0,
  rejected: 0,
  failed: 0,
};

export function FitscoreSummaryCards() {
  const [scopes, setScopes] = useState<FitscoreSummaryScope[]>([]);
  const [scopeId, setScopeId] = useState<"all" | number>("all");
  const [scopeStats, setScopeStats] = useState<
    Record<string, FitscoreSummaryStats>
  >({});
  const [loading, setLoading] = useState(true);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFitscoreSummary();
        if (cancelled) return;

        const nextScopes: FitscoreSummaryScope[] = [
          {
            id: "all",
            label: "All requirements",
            stats: result.overall,
          },
          ...result.requirements.map((row) => ({
            id: row.requirement_index,
            label: `Requirement ${row.requirement_index}`,
            stats: emptyStats,
          })),
        ];

        setScopes(nextScopes);
        setScopeStats({ all: result.overall });
        setScopeId("all");
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load summary"
        );
        setScopes([]);
        setScopeStats({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (scopeId === "all") return;

    const cacheKey = String(scopeId);
    if (scopeStats[cacheKey]) return;

    let cancelled = false;

    async function loadRequirementSummary() {
      setScopeLoading(true);
      setError(null);

      try {
        const result = await fetchFitscoreRequirementSummary(scopeId as number);
        if (cancelled) return;

        const stats: FitscoreSummaryStats = {
          totalInput: result.totalInput,
          accepted: result.accepted,
          rejected: result.rejected,
          failed: result.failed,
        };

        setScopeStats((prev) => ({ ...prev, [cacheKey]: stats }));
        setScopes((prev) =>
          prev.map((scope) =>
            scope.id === scopeId ? { ...scope, stats } : scope
          )
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load requirement summary"
          );
        }
      } finally {
        if (!cancelled) setScopeLoading(false);
      }
    }

    void loadRequirementSummary();

    return () => {
      cancelled = true;
    };
  }, [scopeId, scopeStats]);

  const activeScope = useMemo(
    () => scopes.find((scope) => scope.id === scopeId) ?? scopes[0],
    [scopeId, scopes]
  );

  const activeStats =
    scopeId === "all"
      ? scopeStats.all
      : scopeStats[String(scopeId)] ?? activeScope?.stats;

  const stats = activeStats ?? emptyStats;
  const { accepted, rejected, failed } = stats;
  const { nonFailed, successRate, acceptanceRate } = computeFitscoreRates(stats);
  const cardsLoading = loading || (scopeId !== "all" && scopeLoading);

  if (loading) {
    return (
      <div className="mb-6 space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`rate-${index}`}
              className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
            >
              <SkeletonBar className="h-4 w-24" />
              <SkeletonBar className="mt-3 h-9 w-20" />
              <SkeletonBar className="mt-4 h-2 w-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`count-${index}`}
              className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
            >
              <SkeletonBar className="h-4 w-24" />
              <SkeletonBar className="mt-3 h-9 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !activeScope) {
    return (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!activeScope) {
    return null;
  }

  const scopeLabel =
    scopeId === "all" ? "all requirements" : activeScope.label.toLowerCase();

  return (
    <div className="mb-6">
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {scopes.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {scopes.map((scope) => {
            const active = scopeId === scope.id;

            return (
              <button
                key={String(scope.id)}
                type="button"
                onClick={() => setScopeId(scope.id)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-violet-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {cardsLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`rate-${index}`}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <SkeletonBar className="h-4 w-24" />
                <SkeletonBar className="mt-3 h-9 w-20" />
                <SkeletonBar className="mt-4 h-2 w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`count-${index}`}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <SkeletonBar className="h-4 w-24" />
                <SkeletonBar className="mt-3 h-9 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <MetricCard
              large
              label="Success Rate"
              value={`${successRate}%`}
              progress={successRate}
              subtext={`${nonFailed} of ${stats.totalInput} candidates did not fail (${scopeLabel})`}
              icon={Percent}
              iconClassName="text-violet-600"
              iconBoxClassName="bg-violet-100"
              valueClassName="text-violet-600"
              progressClassName="bg-violet-500"
            />
            <MetricCard
              large
              label="Acceptance Rate"
              value={`${acceptanceRate}%`}
              progress={acceptanceRate}
              subtext={`${accepted} of ${nonFailed} non-failed candidates accepted (${scopeLabel})`}
              icon={CheckCircle2}
              iconClassName="text-emerald-600"
              iconBoxClassName="bg-emerald-100"
              valueClassName="text-emerald-600"
              progressClassName="bg-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <MetricCard
              label="Accepted"
              value={accepted}
              subtext={`Candidates accepted for ${scopeLabel}`}
              icon={CheckCircle2}
              iconClassName="text-emerald-600"
              iconBoxClassName="bg-emerald-100"
              valueClassName="text-emerald-600"
            />
            <MetricCard
              label="Below Cutoff, Rejected"
              value={rejected}
              subtext={`Candidates rejected for ${scopeLabel}`}
              icon={XCircle}
              iconClassName="text-red-600"
              iconBoxClassName="bg-red-100"
              valueClassName="text-red-600"
            />
            <MetricCard
              label="Failed"
              value={failed}
              subtext={`Candidates failed during fitscore for ${scopeLabel}`}
              icon={AlertTriangle}
              iconClassName="text-amber-600"
              iconBoxClassName="bg-amber-100"
              valueClassName="text-amber-600"
            />
          </div>
        </>
      )}
    </div>
  );
}
