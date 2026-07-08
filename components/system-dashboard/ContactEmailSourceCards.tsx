"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Globe, MailSearch, Radar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  mockContactEmailSourceStats,
  type ContactEmailSourceMockStats,
  type ContactSourceNotFoundReason,
  type ContactWebsiteFailureDetail,
} from "@/lib/mock-data/contact-email-source";

type DetailView = "apollo" | "anymailFinder" | "emailFromWebsite" | null;

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

function NotFoundReasonsList({ reasons }: { reasons: ContactSourceNotFoundReason[] }) {
  const totalMisses = reasons.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Reasons candidates did not receive an email from this source.
      </p>
      <ul className="space-y-3">
        {reasons.map((row) => {
          const share =
            totalMisses > 0 ? Math.round((row.count / totalMisses) * 100) : 0;

          return (
            <li
              key={row.reason}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 [overflow-wrap:anywhere]">
                  {row.reason}
                </p>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                  {row.count}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{share}% of misses</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WebsiteFailureDetailsList({
  failures,
}: {
  failures: ContactWebsiteFailureDetail[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Stages where website-based email discovery failed and the recorded reasons.
      </p>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Stage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Reason
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {failures.map((row) => (
              <tr key={`${row.stage}-${row.reason}`}>
                <td className="px-4 py-3 align-top font-mono text-xs text-gray-700">
                  {row.stage}
                </td>
                <td className="px-4 py-3 align-top text-gray-800 [overflow-wrap:anywhere]">
                  {row.reason}
                </td>
                <td className="px-4 py-3 align-top text-right font-medium text-gray-700">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getDetailModalTitle(view: DetailView): string {
  if (view === "apollo") return "Apollo API — not found reasons";
  if (view === "anymailFinder") return "Anymail Finder — not found reasons";
  if (view === "emailFromWebsite") return "Email from website — stage details";
  return "";
}

export function ContactEmailSourceCards({
  stats = mockContactEmailSourceStats,
}: {
  stats?: ContactEmailSourceMockStats;
}) {
  const [detailView, setDetailView] = useState<DetailView>(null);

  return (
    <>
      <SummarySection
        title="Email source breakdown"
        description="Share of candidates that obtained email through each discovery source"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <SourceMetricCard
            label="Apollo API"
            rate={stats.apollo.rate}
            found={stats.apollo.found}
            total={stats.apollo.total}
            icon={Radar}
            iconClassName="text-indigo-600"
            iconBoxClassName="bg-indigo-100"
            valueClassName="text-indigo-600"
            progressClassName="bg-indigo-500"
            onViewDetails={() => setDetailView("apollo")}
          />
          <SourceMetricCard
            label="Anymail Finder"
            rate={stats.anymailFinder.rate}
            found={stats.anymailFinder.found}
            total={stats.anymailFinder.total}
            icon={MailSearch}
            iconClassName="text-cyan-600"
            iconBoxClassName="bg-cyan-100"
            valueClassName="text-cyan-600"
            progressClassName="bg-cyan-500"
            onViewDetails={() => setDetailView("anymailFinder")}
          />
          <SourceMetricCard
            label="Email from website"
            rate={stats.emailFromWebsite.rate}
            found={stats.emailFromWebsite.found}
            total={stats.emailFromWebsite.total}
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
        {detailView === "apollo" ? (
          <NotFoundReasonsList reasons={stats.apollo.notFoundReasons} />
        ) : null}
        {detailView === "anymailFinder" ? (
          <NotFoundReasonsList reasons={stats.anymailFinder.notFoundReasons} />
        ) : null}
        {detailView === "emailFromWebsite" ? (
          <WebsiteFailureDetailsList failures={stats.emailFromWebsite.failures} />
        ) : null}
      </Modal>
    </>
  );
}
