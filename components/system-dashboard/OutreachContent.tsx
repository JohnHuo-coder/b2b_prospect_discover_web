"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, GitBranch, Search } from "lucide-react";
import {
  fetchOutreachCandidateDetail,
  fetchOutreachCandidates,
  type OutreachCandidate,
  type OutreachStatusFilter,
  type OutreachTableCandidate,
} from "@/lib/api/system-dashboard-client";
import { OutreachCandidateDetail } from "./OutreachCandidateDetail";
import { OutreachSummaryCards } from "./OutreachSummaryCards";
import { DataTableSection } from "./MetricCard";
import { Pagination } from "@/components/ui/Pagination";
import {
  OutreachStatusWithTag,
  SystemDashboardBackLink,
} from "./SystemDashboardShared";

const CANDIDATES_PAGE_SIZE = 25;

const statusFilters: OutreachStatusFilter[] = [
  "all",
  "succeed",
  "failed",
  "require_review",
  "pending",
  "rejected",
];

const statusFilterLabels: Record<OutreachStatusFilter, string> = {
  all: "All",
  succeed: "Succeed",
  failed: "Failed",
  require_review: "Require Review",
  pending: "Pending",
  rejected: "Rejected",
};

export function OutreachContent() {
  const [candidates, setCandidates] = useState<OutreachTableCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OutreachStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<OutreachCandidate | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleCandidateUpdated = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [search, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchOutreachCandidates({
          search: search.trim() || undefined,
          status: statusFilter,
          page,
          limit: CANDIDATES_PAGE_SIZE,
        });
        if (cancelled) return;
        setCandidates(result.candidates);
        setTotal(result.total);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load candidates"
        );
        setCandidates([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(load, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, statusFilter, page, refreshToken]);

  const totalPages = Math.max(1, Math.ceil(total / CANDIDATES_PAGE_SIZE));

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    const summary = candidates.find((candidate) => candidate.id === selectedId);
    if (!summary) return;

    const candidateId = selectedId;
    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedDetail({
        id: summary.id,
        company: summary.company,
        website: summary.website,
        status: summary.status,
        human_approved_tag: summary.human_approved_tag,
        human_review_modified: null,
        human_review_analytic_status: null,
        human_review_edit_severity: null,
        final_stage: "",
        reason: "",
        emails: [],
        need_review_email: null,
      });

      try {
        const detail = await fetchOutreachCandidateDetail(candidateId);
        if (!cancelled) setSelectedDetail(detail);
      } catch (loadError) {
        if (!cancelled) {
          setDetailError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load candidate details"
          );
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId, candidates, refreshToken]);

  return (
    <div className="px-8 py-8">
      <SystemDashboardBackLink
        title="Outreach"
        subtitle="Outreach email drafts and compliance check results"
      />

      <OutreachSummaryCards key={refreshToken} />

      <div className="mb-6">
        <Link
          href="/system-dashboard/outreach/pipeline"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
        >
          <GitBranch className="h-4 w-4" />
          View failure on each stage
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company or website..."
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
                {statusFilterLabels[status]}
              </button>
            );
          })}
        </div>
      </div>

      <DataTableSection
        title="Candidates"
        subtitle={
          loading ? "Loading candidates..." : `${total} candidates processed`
        }
        hint="Click a row to view outreach details"
      >
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-20" />
            <col className="w-[32%]" />
            <col className="w-[38%]" />
            <col className="w-28" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Website</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No candidates match your filters.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => {
                const selected = selectedId === candidate.id;

                return (
                  <tr
                    key={candidate.id}
                    onClick={() => setSelectedId(candidate.id)}
                    className={`cursor-pointer border-b border-gray-50 last:border-b-0 transition hover:bg-gray-50/60 ${
                      selected ? "bg-violet-50/60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {candidate.id}
                    </td>
                    <td
                      className="truncate px-6 py-4 text-sm font-semibold text-gray-900"
                      title={candidate.company}
                    >
                      {candidate.company}
                    </td>
                    <td className="px-6 py-4">
                      {candidate.website ? (
                        <a
                          href={
                            candidate.website.startsWith("http")
                              ? candidate.website
                              : `https://${candidate.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title={candidate.website}
                          className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="truncate">{candidate.website}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <OutreachStatusWithTag
                        status={candidate.status}
                        humanApprovedTag={candidate.human_approved_tag}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={CANDIDATES_PAGE_SIZE}
          loading={loading}
          onPageChange={(nextPage) => {
            setSelectedId(null);
            setPage(nextPage);
          }}
        />
      </DataTableSection>

      <OutreachCandidateDetail
        candidate={selectedDetail}
        loading={detailLoading}
        error={detailError}
        onClose={() => setSelectedId(null)}
        onUpdated={handleCandidateUpdated}
      />
    </div>
  );
}
