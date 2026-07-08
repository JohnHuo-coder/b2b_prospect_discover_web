"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ClipboardList,
  FileCheck,
  PenLine,
  Percent,
  ThumbsUp,
} from "lucide-react";
import { safeSummaryCount } from "@/lib/system-dashboard/outreach-status";
import {
  fetchOutreachSummary,
  type OutreachSummaryStats,
} from "@/lib/api/system-dashboard-client";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { MetricCard } from "./MetricCard";

const emptyStats: OutreachSummaryStats = {
  totalInput: 0,
  succeed: 0,
  totalSucceed: 0,
  failed: 0,
  requireReview: 0,
  humanReviewTotal: 0,
  humanReviewPending: 0,
  humanReviewApproved: 0,
  humanReviewRejected: 0,
  modifiedCandidates: 0,
  analyzedCandidates: 0,
  majorChangedCandidates: 0,
  minorChangedCandidates: 0,
  approvedWithoutModification: 0,
};

function computePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function computeOutreachRates(stats: OutreachSummaryStats) {
  const totalInput = safeSummaryCount(stats.totalInput);
  const succeed = safeSummaryCount(stats.succeed);
  const nonFailed = totalInput - safeSummaryCount(stats.failed);
  const humanReviewTotal = safeSummaryCount(stats.humanReviewTotal);
  const humanReviewApproved = safeSummaryCount(stats.humanReviewApproved);
  const humanReviewPending = safeSummaryCount(stats.humanReviewPending);
  const humanReviewRejected = safeSummaryCount(stats.humanReviewRejected);
  const modifiedCandidates = safeSummaryCount(stats.modifiedCandidates);
  const analyzedCandidates = safeSummaryCount(stats.analyzedCandidates);
  const majorChangedCandidates = safeSummaryCount(stats.majorChangedCandidates);
  const minorChangedCandidates = safeSummaryCount(stats.minorChangedCandidates);
  const approvedWithoutModification = safeSummaryCount(
    stats.approvedWithoutModification
  );

  const humanReviewDecided = humanReviewApproved + humanReviewRejected;

  return {
    totalInput,
    succeed,
    requireReview: safeSummaryCount(stats.requireReview),
    humanReviewTotal,
    humanReviewApproved,
    humanReviewPending,
    humanReviewRejected,
    humanReviewDecided,
    modifiedCandidates,
    analyzedCandidates,
    majorChangedCandidates,
    minorChangedCandidates,
    approvedWithoutModification,
    nonFailed,
    passRate: computePercent(succeed, totalInput),
    humanReviewRate: computePercent(humanReviewTotal, nonFailed),
    humanReviewApproveRate: computePercent(
      humanReviewApproved,
      humanReviewDecided
    ),
    approveWithoutModificationRate: computePercent(
      approvedWithoutModification,
      humanReviewDecided
    ),
    majorChangeRate: computePercent(
      majorChangedCandidates,
      analyzedCandidates
    ),
    minorChangeRate: computePercent(
      minorChangedCandidates,
      analyzedCandidates
    ),
  };
}

function SummarySection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function RateCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="mt-3 h-9 w-20" />
      <SkeletonBar className="mt-4 h-2 w-full" />
    </div>
  );
}

function CountCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="mt-3 h-9 w-16" />
      <SkeletonBar className="mt-3 h-4 w-full" />
    </div>
  );
}

export function OutreachSummaryCards() {
  const [stats, setStats] = useState<OutreachSummaryStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchOutreachSummary();
        if (!cancelled) {
          setStats(result);
        }
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

  const {
    totalInput,
    succeed,
    humanReviewApproved,
    humanReviewPending,
    humanReviewDecided,
    approvedWithoutModification,
    modifiedCandidates,
    analyzedCandidates,
    majorChangedCandidates,
    minorChangedCandidates,
    nonFailed,
    humanReviewTotal,
    passRate,
    humanReviewRate,
    humanReviewApproveRate,
    approveWithoutModificationRate,
    majorChangeRate,
    minorChangeRate,
  } = computeOutreachRates(stats);

  if (loading) {
    return (
      <div className="mb-6 space-y-5">
        <SummarySection title="Outreach outcomes">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <RateCardSkeleton />
            <RateCardSkeleton />
          </div>
        </SummarySection>
        <SummarySection title="Human review">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <RateCardSkeleton />
            <RateCardSkeleton />
            <RateCardSkeleton />
            <RateCardSkeleton />
            <RateCardSkeleton />
            <CountCardSkeleton />
          </div>
        </SummarySection>
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

      <div className="space-y-5">
        <SummarySection
          title="Outreach outcomes"
          description="Pass rate without human review; human review rate among non-failed candidates"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <MetricCard
              label="Pass Rate"
              value={`${passRate}%`}
              progress={passRate}
              subtext={`${succeed} of ${totalInput} passed`}
              icon={Percent}
              iconClassName="text-violet-600"
              iconBoxClassName="bg-violet-100"
              valueClassName="text-violet-600"
              progressClassName="bg-violet-500"
            />
            <MetricCard
              label="Human Review Rate"
              value={`${humanReviewRate}%`}
              progress={humanReviewRate}
              subtext={`${humanReviewTotal} of ${nonFailed} non-failed candidates`}
              icon={AlertTriangle}
              iconClassName="text-amber-600"
              iconBoxClassName="bg-amber-100"
              valueClassName="text-amber-600"
              progressClassName="bg-amber-500"
            />
          </div>
        </SummarySection>

        <SummarySection
          title="Human review"
          description="Approval rates use decided reviews only (approved or rejected)"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Human Review Approve Rate"
              value={`${humanReviewApproveRate}%`}
              progress={humanReviewApproveRate}
              subtext={`${humanReviewApproved} of ${humanReviewDecided} decided reviews`}
              icon={ThumbsUp}
              iconClassName="text-teal-600"
              iconBoxClassName="bg-teal-100"
              valueClassName="text-teal-600"
              progressClassName="bg-teal-500"
            />
            <MetricCard
              label="Approve Without Modification Rate"
              value={`${approveWithoutModificationRate}%`}
              progress={approveWithoutModificationRate}
              subtext={`${approvedWithoutModification} of ${humanReviewDecided} decided reviews`}
              icon={FileCheck}
              iconClassName="text-emerald-600"
              iconBoxClassName="bg-emerald-100"
              valueClassName="text-emerald-600"
              progressClassName="bg-emerald-500"
            />
            <MetricCard
              label="Major Change Rate"
              value={`${majorChangeRate}%`}
              progress={majorChangeRate}
              subtext={`${majorChangedCandidates} of ${analyzedCandidates} analyzed edits`}
              icon={PenLine}
              iconClassName="text-orange-600"
              iconBoxClassName="bg-orange-100"
              valueClassName="text-orange-600"
              progressClassName="bg-orange-500"
            />
            <MetricCard
              label="Minor Change Rate"
              value={`${minorChangeRate}%`}
              progress={minorChangeRate}
              subtext={`${minorChangedCandidates} of ${analyzedCandidates} analyzed edits`}
              icon={PenLine}
              iconClassName="text-sky-600"
              iconBoxClassName="bg-sky-100"
              valueClassName="text-sky-600"
              progressClassName="bg-sky-500"
            />
            <MetricCard
              label="Pending"
              value={humanReviewPending}
              subtext="Reviews waiting for human decision"
              icon={ClipboardList}
              iconClassName="text-blue-600"
              iconBoxClassName="bg-blue-100"
              valueClassName="text-blue-600"
            />
          </div>
        </SummarySection>
      </div>
    </div>
  );
}
