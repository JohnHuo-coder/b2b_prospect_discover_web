"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import {
  fetchComplianceCheckDetail,
  fetchComplianceCheckQueue,
  type ComplianceCheckDetail,
  type ComplianceCheckListItem,
} from "@/lib/api/human-review-client";
import { ComplianceCheckDetailPanel } from "./ComplianceCheckDetailPanel";
import {
  HumanReviewBackLink,
  JoinCompanyRequiredBanner,
  useHumanReviewAccess,
} from "./HumanReviewShared";
import { DataTableSection } from "@/components/system-dashboard/MetricCard";
import { SkeletonBar } from "@/components/ui/SkeletonBar";

export function ComplianceCheckContent() {
  const { isLoading: authLoading, isPending, isApproved } = useHumanReviewAccess();
  const [items, setItems] = useState<ComplianceCheckListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ComplianceCheckDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleDecisionComplete = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isApproved) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchComplianceCheckQueue();
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load compliance check queue"
        );
        setItems([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isApproved, refreshToken]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    const summary = items.find((item) => item.id === selectedId);
    if (!summary) return;

    const candidateId = selectedId;
    let cancelled = false;

    const loadDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedDetail({
        id: summary.id,
        company: summary.company,
        website: summary.website,
        reason: "",
        issues: [],
        email_text: "",
        email_text_type: "",
        facts: [],
      });

      try {
        const detail = await fetchComplianceCheckDetail(candidateId);
        if (!cancelled) setSelectedDetail(detail);
      } catch (loadError) {
        if (!cancelled) {
          setDetailError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load compliance check detail"
          );
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId, items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const haystack = [item.id, item.company, item.website ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search]);

  if (authLoading) {
    return (
      <div className="px-8 py-8">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="mt-3 h-4 w-72" />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="px-8 py-8">
        <HumanReviewBackLink
          title="Compliance Check"
          subtitle="Outreach emails waiting for manual compliance review"
        />
        <JoinCompanyRequiredBanner />
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <HumanReviewBackLink
        title="Compliance Check"
        subtitle="Outreach emails waiting for manual compliance review"
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company or website..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-950 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      <DataTableSection
        title="Review queue"
        subtitle={
          loading
            ? "Loading queue..."
            : `${total} item${total === 1 ? "" : "s"} pending review`
        }
        hint="Click a row to review"
      >
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-20" />
            <col className="w-[42%]" />
            <col className="w-[38%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-100 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Website</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-zinc-500"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-zinc-500"
                >
                  No items match your search.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const selected = selectedId === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer border-b border-zinc-50 last:border-b-0 transition hover:bg-zinc-50/60 ${
                      selected ? "bg-teal-50/60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-teal-800">
                      {item.id}
                    </td>
                    <td
                      className="truncate px-6 py-4 text-sm font-semibold text-zinc-950"
                      title={item.company}
                    >
                      {item.company}
                    </td>
                    <td className="px-6 py-4">
                      {item.website ? (
                        <a
                          href={
                            item.website.startsWith("http")
                              ? item.website
                              : `https://${item.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title={item.website}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm text-teal-800 hover:text-teal-900"
                        >
                          <span className="truncate">{item.website}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTableSection>

      {selectedDetail ? (
        <ComplianceCheckDetailPanel
          detail={selectedDetail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setSelectedId(null)}
          onDecisionComplete={handleDecisionComplete}
        />
      ) : null}
    </div>
  );
}
