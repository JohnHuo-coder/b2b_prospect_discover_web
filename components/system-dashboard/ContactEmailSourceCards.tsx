"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Globe, MailSearch, Radar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  fetchContactEmailSourceDetail,
  fetchContactSummary,
  type ContactEmailSourceDetailItem,
  type ContactSummaryStats,
} from "@/lib/api/system-dashboard-client";
import type { ContactEmailSourceBreakdown } from "@/lib/system-dashboard/contact-status";
import { SkeletonBar } from "@/components/ui/SkeletonBar";

type DetailView = "apollo" | "anymailFinder" | "emailFromWebsite" | null;

type DetailApiSource = "apollo" | "anymail" | "website";

const detailViewToApiSource: Record<
  Exclude<DetailView, null>,
  DetailApiSource
> = {
  apollo: "apollo",
  anymailFinder: "anymail",
  emailFromWebsite: "website",
};

const emptyEmailSources: ContactEmailSourceBreakdown = {
  apollo: { rate: 0, found: 0, total: 0 },
  anymailFinder: { rate: 0, found: 0, total: 0 },
  emailFromWebsite: { rate: 0, found: 0, total: 0 },
};

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
    <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50/60 p-5">
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

function SourceMetricCard({
  label,
  rate,
  found,
  total,
  icon: Icon,
  iconClassName,
  iconBoxClassName,
  valueClassName,
  progressClassName,
  onViewDetails,
}: {
  label: string;
  rate: number;
  found: number;
  total: number;
  icon: LucideIcon;
  iconClassName: string;
  iconBoxClassName: string;
  valueClassName: string;
  progressClassName: string;
  onViewDetails: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{rate}%</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBoxClassName}`}
        >
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${progressClassName}`}
            style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {found} of {total} candidates found email via this source
        </p>
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
      >
        View details
      </button>
    </div>
  );
}

function SourceCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="mt-3 h-9 w-20" />
      <SkeletonBar className="mt-4 h-2 w-full" />
      <SkeletonBar className="mt-4 h-9 w-full" />
    </div>
  );
}

function formatDetailLabel(label: string): string {
  return label.replaceAll("_", " ");
}

function SourceDetailBreakdown({
  items,
  labelColumn,
  description,
}: {
  items: ContactEmailSourceDetailItem[];
  labelColumn: string;
  description: string;
}) {
  const total = items.reduce((sum, row) => sum + row.count, 0);

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500">No failure breakdown available.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{description}</p>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                {labelColumn}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Count
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((row) => {
              const share =
                total > 0 ? Math.round((row.count / total) * 100) : 0;

              return (
                <tr key={row.label}>
                  <td className="px-4 py-3 align-top font-mono text-xs text-gray-700">
                    {formatDetailLabel(row.label)}
                  </td>
                  <td className="px-4 py-3 align-top text-right font-medium text-gray-700">
                    {row.count}
                  </td>
                  <td className="px-4 py-3 align-top text-right text-gray-500">
                    {share}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getDetailModalTitle(view: DetailView): string {
  if (view === "apollo") return "Apollo API — failure breakdown";
  if (view === "anymailFinder") return "Anymail Finder — failure breakdown";
  if (view === "emailFromWebsite") return "Email from website — failure breakdown";
  return "";
}

export function ContactEmailSourceCards() {
  const [emailSources, setEmailSources] =
    useState<ContactEmailSourceBreakdown>(emptyEmailSources);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<DetailView>(null);
  const [detailItems, setDetailItems] = useState<ContactEmailSourceDetailItem[]>(
    []
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result: ContactSummaryStats = await fetchContactSummary();
        if (!cancelled) {
          setEmailSources(result.emailSources ?? emptyEmailSources);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load email source summary"
          );
          setEmailSources(emptyEmailSources);
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

  useEffect(() => {
    if (!detailView) {
      setDetailItems([]);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    const apiSource = detailViewToApiSource[detailView];

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const items = await fetchContactEmailSourceDetail(apiSource);
        if (!cancelled) {
          setDetailItems(items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDetailError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load email source details"
          );
          setDetailItems([]);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [detailView]);

  if (loading) {
    return (
      <SummarySection
        title="Email source breakdown"
        description="Success rate for each email discovery source"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <SourceCardSkeleton />
          <SourceCardSkeleton />
          <SourceCardSkeleton />
        </div>
      </SummarySection>
    );
  }

  return (
    <>
      <SummarySection
        title="Email source breakdown"
        description="Success rate for each email discovery source"
      >
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <SourceMetricCard
            label="Apollo API"
            rate={emailSources.apollo.rate}
            found={emailSources.apollo.found}
            total={emailSources.apollo.total}
            icon={Radar}
            iconClassName="text-indigo-600"
            iconBoxClassName="bg-indigo-100"
            valueClassName="text-indigo-600"
            progressClassName="bg-indigo-500"
            onViewDetails={() => setDetailView("apollo")}
          />
          <SourceMetricCard
            label="Anymail Finder"
            rate={emailSources.anymailFinder.rate}
            found={emailSources.anymailFinder.found}
            total={emailSources.anymailFinder.total}
            icon={MailSearch}
            iconClassName="text-cyan-600"
            iconBoxClassName="bg-cyan-100"
            valueClassName="text-cyan-600"
            progressClassName="bg-cyan-500"
            onViewDetails={() => setDetailView("anymailFinder")}
          />
          <SourceMetricCard
            label="Email from website"
            rate={emailSources.emailFromWebsite.rate}
            found={emailSources.emailFromWebsite.found}
            total={emailSources.emailFromWebsite.total}
            icon={Globe}
            iconClassName="text-teal-600"
            iconBoxClassName="bg-teal-100"
            valueClassName="text-teal-600"
            progressClassName="bg-teal-500"
            onViewDetails={() => setDetailView("emailFromWebsite")}
          />
        </div>
      </SummarySection>

      <Modal
        open={detailView !== null}
        title={getDetailModalTitle(detailView)}
        onClose={() => setDetailView(null)}
        size="lg"
      >
        {detailLoading ? (
          <div className="space-y-3">
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-5/6" />
            <SkeletonBar className="h-4 w-4/6" />
          </div>
        ) : null}

        {!detailLoading && detailError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {detailError}
          </div>
        ) : null}

        {!detailLoading && !detailError && detailView === "apollo" ? (
          <SourceDetailBreakdown
            items={detailItems}
            labelColumn="Status"
            description="Candidates that did not receive an email from Apollo, grouped by apollo_status."
          />
        ) : null}

        {!detailLoading && !detailError && detailView === "anymailFinder" ? (
          <SourceDetailBreakdown
            items={detailItems}
            labelColumn="Status"
            description="Candidates that reached Anymail Finder without Apollo success, grouped by anymail_finder_status."
          />
        ) : null}

        {!detailLoading && !detailError && detailView === "emailFromWebsite" ? (
          <SourceDetailBreakdown
            items={detailItems}
            labelColumn="Stage"
            description="Candidates that failed after Apollo and Anymail Finder, grouped by final_stage."
          />
        ) : null}
      </Modal>
    </>
  );
}
