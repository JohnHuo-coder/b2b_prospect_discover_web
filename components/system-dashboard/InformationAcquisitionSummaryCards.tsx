"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Globe, Percent, Sparkles } from "lucide-react";
import {
  fetchInfoAcquisitionRequirementSummary,
  fetchInfoAcquisitionSummary,
  fetchInfoAcquisitionWebsiteUrlFailureBreakdown,
  type InfoAcquisitionRequirementSummaryStats,
  type InfoAcquisitionSummaryScope,
  type InfoAcquisitionSummaryStats,
  type InfoAcquisitionWebsiteUrlFailureBreakdown,
  type InfoAcquisitionWebsiteUrlStats,
} from "@/lib/api/system-dashboard-client";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { MetricCard } from "./MetricCard";

const emptyWebsiteUrlStats: InfoAcquisitionWebsiteUrlStats = {
  totalInput: 0,
  acquired: 0,
  failed: 0,
};

const emptyFailureBreakdown: InfoAcquisitionWebsiteUrlFailureBreakdown = {
  totalFailed: 0,
  stages: [],
};

function formatBreakdownLabel(label: string): string {
  return label.replaceAll("_", " ");
}

function WebsiteUrlFailureBreakdown({
  breakdown,
}: {
  breakdown: InfoAcquisitionWebsiteUrlFailureBreakdown;
}) {
  const { totalFailed, stages } = breakdown;

  if (totalFailed === 0 || stages.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No failure breakdown available.</p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600">
        {totalFailed} failed candidates grouped by final stage and reason. Share
        is the percentage of all URL acquisition failures.
      </p>

      {stages.map((stage) => (
        <section
          key={stage.final_stage}
          className="overflow-hidden rounded-lg border border-zinc-200"
        >
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Final stage
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                {formatBreakdownLabel(stage.final_stage)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-950">{stage.count}</p>
              <p className="text-xs text-zinc-500">{stage.percentage}% of failures</p>
            </div>
          </div>

          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Reason
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Count
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {stage.reasons.map((reason) => (
                <tr key={`${stage.final_stage}-${reason.reason}`}>
                  <td className="px-4 py-3 align-top font-mono text-xs text-zinc-700">
                    {formatBreakdownLabel(reason.reason)}
                  </td>
                  <td className="px-4 py-3 align-top text-right font-medium text-zinc-700">
                    {reason.count}
                  </td>
                  <td className="px-4 py-3 align-top text-right text-zinc-500">
                    {reason.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

const emptyRequirementStats: InfoAcquisitionRequirementSummaryStats = {
  totalInput: 0,
  succeed: 0,
  failed: 0,
  passRatePool: 0,
  reviewFactsSuccess: 0,
  reviewFactsSufficient: 0,
};

function computePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function SummaryCardSkeleton({ count }: { count: number }) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 ${
        count === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
      }`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
        >
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="mt-3 h-9 w-20" />
          <SkeletonBar className="mt-4 h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function InformationAcquisitionSummaryCards() {
  const [scopes, setScopes] = useState<InfoAcquisitionSummaryScope[]>([]);
  const [scopeId, setScopeId] = useState<"all" | number>("all");
  const [scopeStats, setScopeStats] = useState<
    Record<string, InfoAcquisitionSummaryStats>
  >({});
  const [requirementStats, setRequirementStats] = useState<
    Record<string, InfoAcquisitionRequirementSummaryStats>
  >({});
  const [websiteUrlStats, setWebsiteUrlStats] =
    useState<InfoAcquisitionWebsiteUrlStats>(emptyWebsiteUrlStats);
  const [loading, setLoading] = useState(true);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [websiteUrlDetailOpen, setWebsiteUrlDetailOpen] = useState(false);
  const [websiteUrlFailureBreakdown, setWebsiteUrlFailureBreakdown] =
    useState<InfoAcquisitionWebsiteUrlFailureBreakdown>(emptyFailureBreakdown);
  const [websiteUrlDetailLoading, setWebsiteUrlDetailLoading] = useState(false);
  const [websiteUrlDetailError, setWebsiteUrlDetailError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchInfoAcquisitionSummary();
        if (cancelled) return;

        const nextScopes: InfoAcquisitionSummaryScope[] = [
          {
            id: "all",
            label: "All requirements",
            stats: result.overall,
          },
          ...result.requirements.map((row) => ({
            id: row.requirement_index,
            label: `Requirement ${row.requirement_index}`,
            stats: { totalInput: 0, succeed: 0, failed: 0 },
          })),
        ];

        setScopes(nextScopes);
        setScopeStats({ all: result.overall });
        setWebsiteUrlStats(result.websiteUrlAcquisition ?? emptyWebsiteUrlStats);
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
        setWebsiteUrlStats(emptyWebsiteUrlStats);
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

    const requirementIndex = scopeId;
    const cacheKey = String(requirementIndex);
    if (requirementStats[cacheKey]) return;

    let cancelled = false;

    async function loadRequirementSummary() {
      setScopeLoading(true);
      setError(null);

      try {
        const result =
          await fetchInfoAcquisitionRequirementSummary(requirementIndex);
        if (cancelled) return;

        const stats: InfoAcquisitionRequirementSummaryStats = {
          totalInput: result.totalInput,
          succeed: result.succeed,
          failed: result.failed,
          passRatePool: result.passRatePool,
          reviewFactsSuccess: result.reviewFactsSuccess,
          reviewFactsSufficient: result.reviewFactsSufficient,
        };

        setRequirementStats((prev) => ({ ...prev, [cacheKey]: stats }));
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
  }, [scopeId, requirementStats]);

  useEffect(() => {
    if (!websiteUrlDetailOpen) return;

    let cancelled = false;

    async function loadFailureBreakdown() {
      setWebsiteUrlDetailLoading(true);
      setWebsiteUrlDetailError(null);

      try {
        const result = await fetchInfoAcquisitionWebsiteUrlFailureBreakdown();
        if (!cancelled) {
          setWebsiteUrlFailureBreakdown(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setWebsiteUrlDetailError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load failure breakdown"
          );
          setWebsiteUrlFailureBreakdown(emptyFailureBreakdown);
        }
      } finally {
        if (!cancelled) setWebsiteUrlDetailLoading(false);
      }
    }

    void loadFailureBreakdown();

    return () => {
      cancelled = true;
    };
  }, [websiteUrlDetailOpen]);

  const activeScope = useMemo(
    () => scopes.find((scope) => scope.id === scopeId) ?? scopes[0],
    [scopeId, scopes]
  );

  const activeAllStats = scopeStats.all ?? { totalInput: 0, succeed: 0, failed: 0 };
  const activeRequirementStats =
    scopeId === "all"
      ? emptyRequirementStats
      : requirementStats[String(scopeId)] ?? emptyRequirementStats;

  const { totalInput: allTotalInput, succeed: allSucceed } = activeAllStats;
  const allPassRate = computePercent(allSucceed, allTotalInput);
  const { totalInput: urlTotalInput, acquired: urlAcquired } = websiteUrlStats;
  const websiteUrlAcquisitionRate = computePercent(urlAcquired, urlTotalInput);

  const {
    totalInput: reqTotalInput,
    succeed: reqSucceed,
    passRatePool,
    reviewFactsSuccess,
    reviewFactsSufficient,
  } = activeRequirementStats;
  const requirementPassRate = computePercent(reqSucceed, passRatePool);
  const reviewExtractionRate = computePercent(reviewFactsSuccess, reqTotalInput);
  const reviewSufficientRate = computePercent(
    reviewFactsSufficient,
    reqSucceed
  );

  const cardsLoading = loading || (scopeId !== "all" && scopeLoading);
  const isAllScope = scopeId === "all";
  const skeletonCount = isAllScope ? 2 : 3;

  if (loading) {
    return (
      <div className="mb-6">
        <SummaryCardSkeleton count={2} />
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
                    ? "bg-teal-800 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {cardsLoading ? (
        <SummaryCardSkeleton count={skeletonCount} />
      ) : isAllScope ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <MetricCard
            label="Company website URL acquisition rate"
            value={`${websiteUrlAcquisitionRate}%`}
            progress={websiteUrlAcquisitionRate}
            subtext={`${urlAcquired} of ${urlTotalInput}`}
            icon={Globe}
            iconClassName="text-sky-600"
            iconBoxClassName="bg-sky-100"
            valueClassName="text-sky-600"
            progressClassName="bg-sky-500"
            onViewDetails={() => setWebsiteUrlDetailOpen(true)}
          />
          <MetricCard
            label="Pass Rate"
            value={`${allPassRate}%`}
            progress={allPassRate}
            subtext={`${allSucceed} of ${allTotalInput}`}
            icon={Percent}
            iconClassName="text-teal-800"
            iconBoxClassName="bg-teal-100"
            valueClassName="text-teal-800"
            progressClassName="bg-teal-500"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MetricCard
            label="Pass Rate"
            value={`${requirementPassRate}%`}
            progress={requirementPassRate}
            subtext={`${reqSucceed} of ${passRatePool}`}
            icon={Percent}
            iconClassName="text-teal-800"
            iconBoxClassName="bg-teal-100"
            valueClassName="text-teal-800"
            progressClassName="bg-teal-500"
          />
          <MetricCard
            label="Google review fact extraction success rate"
            value={`${reviewExtractionRate}%`}
            progress={reviewExtractionRate}
            subtext={`${reviewFactsSuccess} of ${reqTotalInput}`}
            icon={Sparkles}
            iconClassName="text-amber-600"
            iconBoxClassName="bg-amber-100"
            valueClassName="text-amber-600"
            progressClassName="bg-amber-500"
          />
          <MetricCard
            label="Review facts sufficient rate"
            value={`${reviewSufficientRate}%`}
            progress={reviewSufficientRate}
            subtext={`${reviewFactsSufficient} of ${reqSucceed}`}
            icon={BadgeCheck}
            iconClassName="text-emerald-600"
            iconBoxClassName="bg-emerald-100"
            valueClassName="text-emerald-600"
            progressClassName="bg-emerald-500"
          />
        </div>
      )}

      <Modal
        open={websiteUrlDetailOpen}
        title="Company website URL acquisition — failure breakdown"
        onClose={() => setWebsiteUrlDetailOpen(false)}
        size="lg"
      >
        {websiteUrlDetailLoading ? (
          <div className="space-y-3">
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-5/6" />
            <SkeletonBar className="h-4 w-4/6" />
          </div>
        ) : null}

        {!websiteUrlDetailLoading && websiteUrlDetailError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {websiteUrlDetailError}
          </div>
        ) : null}

        {!websiteUrlDetailLoading && !websiteUrlDetailError ? (
          <WebsiteUrlFailureBreakdown breakdown={websiteUrlFailureBreakdown} />
        ) : null}
      </Modal>
    </div>
  );
}
