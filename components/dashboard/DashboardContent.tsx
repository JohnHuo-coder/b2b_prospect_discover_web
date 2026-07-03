"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { Pagination } from "@/components/ui/Pagination";
import { fetchDashboardSummary } from "@/lib/api/dashboard-client";
import { fetchLeads } from "@/lib/api/leads-client";
import {
  searchBusinesses,
  updateBusinessJoin,
  type BusinessSearchResult,
} from "@/lib/api/business-search-client";
import { useUser } from "@/components/providers/UserProvider";
import { getUserDisplayName, hasUserName } from "@/lib/auth/userDisplay";
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

const LEADS_PAGE_SIZE = 25;

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

function normalizeBusinessId(
  value: number | string | null | undefined
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function BusinessJoinActions({
  business,
  userBusinessId,
  acting,
  onJoin,
  onCancel,
}: {
  business: BusinessSearchResult;
  userBusinessId: string | null;
  acting: boolean;
  onJoin: (businessId: string) => void;
  onCancel: () => void;
}) {
  const rowBusinessId = normalizeBusinessId(business.business_id);
  const isPending = Boolean(
    userBusinessId && rowBusinessId && userBusinessId === rowBusinessId
  );
  const canJoin = userBusinessId === null && rowBusinessId !== null;
  const joinDisabled = Boolean(userBusinessId && !isPending);

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Pending
        </span>
        <button
          type="button"
          disabled={acting}
          onClick={onCancel}
          className="text-xs font-medium text-violet-600 transition hover:text-violet-700 hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!canJoin || joinDisabled || acting || !rowBusinessId}
      onClick={() => rowBusinessId && onJoin(rowBusinessId)}
      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
    >
      Join
    </button>
  );
}

function PendingDashboard() {
  const { user, refreshUser } = useUser();
  const userBusinessId = normalizeBusinessId(user?.business_id);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<BusinessSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const trimmed = search.trim();

    if (!trimmed) {
      setResults([]);
      setError("");
      setHasSearched(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const businesses = await searchBusinesses(trimmed);
        if (!cancelled) {
          setResults(businesses);
          setHasSearched(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to search businesses"
          );
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const handleJoin = async (businessId: string) => {
    setActing(true);
    setActionError("");

    try {
      await updateBusinessJoin(Number(businessId));
      await refreshUser();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to request join"
      );
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setActing(true);
    setActionError("");

    try {
      await updateBusinessJoin(null);
      await refreshUser();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to cancel join request"
      );
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
        You need to join a company first.
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by business name, owner email or name..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="mt-3 text-sm text-gray-500">
        {loading
          ? "Searching..."
          : hasSearched
            ? `${results.length} result${results.length === 1 ? "" : "s"}`
            : null}
      </div>

      {hasSearched ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Owner Email</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((business) => (
                <tr
                  key={business.firebaseUid}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {business.business_name?.trim() || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {hasUserName(business)
                      ? getUserDisplayName(business)
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {business.email}
                  </td>
                  <td className="px-6 py-4">
                    <BusinessJoinActions
                      business={business}
                      userBusinessId={userBusinessId}
                      acting={acting}
                      onJoin={handleJoin}
                      onCancel={() => void handleCancel()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && results.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No businesses match your search.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardContent() {
  const { user, isLoading: authLoading } = useUser();
  const isPending = Boolean(user && (!user.role || user.role === "pending"));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [summary, setSummary] = useState<Record<
    (typeof summaryCardMeta)[number]["key"],
    number
  > | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (authLoading || isPending) return;

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
  }, [authLoading, user, isPending]);

  useEffect(() => {
    if (authLoading || isPending) return;

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
          page,
          limit: LEADS_PAGE_SIZE,
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
  }, [search, statusFilter, page, authLoading, user, isPending]);

  const totalPages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));

  const showSummarySkeleton =
    !isPending &&
    !summaryError &&
    summary === null &&
    (authLoading || Boolean(user));

  if (authLoading) {
    return (
      <div className="px-8 py-8">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="mt-3 h-4 w-72" />
        <div className="mt-8 space-y-6">
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isPending) {
    return <PendingDashboard />;
  }

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
        {leadsLoading ? "Loading..." : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Contact</th>
              <th className="w-44 max-w-44 px-6 py-4">Website</th>
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
                <td className="w-44 max-w-44 px-6 py-4">
                  {lead.website ? (
                    <a
                      href={
                        lead.website.startsWith("http")
                          ? lead.website
                          : `https://${lead.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      title={lead.website}
                      className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="truncate">{lead.website}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
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

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={LEADS_PAGE_SIZE}
          loading={leadsLoading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
