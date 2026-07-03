"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { fetchDashboardSummary } from "@/lib/api/dashboard-client";
import { fetchLeads } from "@/lib/api/leads-client";
import { useUser } from "@/components/providers/UserProvider";
import { statusLabels, type Lead, type LeadStatus } from "@/lib/mock-data";

const summaryCardMeta = [
  {
    key: "sent" as const,
    label: "Email Sent",
    valueClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  {
    key: "heard_back" as const,
    label: "Heard Back",
    valueClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  {
    key: "pending" as const,
    label: "Pending",
    valueClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
  {
    key: "rejected" as const,
    label: "Rejected",
    valueClass: "text-gray-600",
    bgClass: "bg-gray-100",
  },
];

const statusFilters: Array<LeadStatus | "all"> = [
  "all",
  "sent",
  "heard_back",
  "pending",
  "rejected",
];

function SummaryStatCard({
  label,
  value,
  valueClass,
  bgClass,
  loading,
}: {
  label: string;
  value: number;
  valueClass: string;
  bgClass: string;
  loading: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 ${bgClass} px-5 py-4`}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <SkeletonBar className="h-4 w-28" />
          <SkeletonBar className="mt-3 h-9 w-16" />
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
        </>
      )}
    </div>
  );
}

export function DashboardContent() {
  const { user, isLoading: authLoading } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [summary, setSummary] = useState<Record<
    (typeof summaryCardMeta)[number]["key"],
    number
  > | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSummary(null);
      setSummaryError("Please sign in to view dashboard.");
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      setSummary(null);
      setSummaryError("");

      try {
        const result = await fetchDashboardSummary();

        if (!cancelled) {
          setSummary(result);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(
            err instanceof Error ? err.message : "Failed to load summary"
          );
          setSummary(null);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLeadsError("Please sign in to view leads.");
      setLeads([]);
      setTotal(0);
      setLeadsLoading(false);
      return;
    }

    let cancelled = false;

    const loadLeads = async () => {
      setLeadsLoading(true);
      setLeadsError("");

      try {
        const result = await fetchLeads({
          search: search.trim() || undefined,
          status: statusFilter,
          limit: 100,
        });

        if (!cancelled) {
          setLeads(result.leads);
          setTotal(result.total);
        }
      } catch (err) {
        if (!cancelled) {
          setLeadsError(
            err instanceof Error ? err.message : "Failed to load leads"
          );
          setLeads([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLeadsLoading(false);
        }
      }
    };

    const timer = setTimeout(loadLeads, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, statusFilter, authLoading, user]);

  const showSummarySkeleton =
    !summaryError && summary === null && (authLoading || Boolean(user));

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">All lead candidates</p>
      </div>

      {summaryError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {summaryError}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCardMeta.map((card) => (
          <SummaryStatCard
            key={card.key}
            label={card.label}
            value={summary?.[card.key] ?? 0}
            valueClass={card.valueClass}
            bgClass={card.bgClass}
            loading={showSummarySkeleton}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company, ID or contact..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((status) => {
            const active = statusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-violet-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {statusLabels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {leadsError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {leadsError}
        </div>
      ) : null}

      <div className="mb-3 text-right text-sm text-gray-500">
        {leadsLoading ? "Loading..." : `${total} results`}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Website</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Added</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
              >
                <td className="px-6 py-4 text-sm text-gray-500">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="block text-violet-600 hover:text-violet-700"
                  >
                    {lead.id}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  <Link href={`/leads/${lead.id}`} className="hover:text-violet-700">
                    {lead.company}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <Link href={`/leads/${lead.id}`} className="block hover:text-violet-700">
                    {lead.contact}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {lead.website ? (
                    <a
                      href={
                        lead.website.startsWith("http")
                          ? lead.website
                          : `https://${lead.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {lead.website}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/leads/${lead.id}`} className="inline-block">
                    <StatusBadge status={lead.status} />
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <Link href={`/leads/${lead.id}`} className="block hover:text-violet-700">
                    {lead.added}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!leadsLoading && leads.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No leads match your filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
