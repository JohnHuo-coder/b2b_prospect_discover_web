"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import {
  fetchEmailClassificationDetail,
  fetchEmailClassificationQueue,
  type EmailClassificationDetail,
  type EmailClassificationListItem,
} from "@/lib/api/human-review-client";
import { EmailClassificationDetailPanel } from "./EmailClassificationDetailPanel";
import { HumanReviewBackLink } from "./HumanReviewShared";
import { DataTableSection } from "@/components/system-dashboard/MetricCard";

export function EmailClassificationContent() {
  const [items, setItems] = useState<EmailClassificationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<EmailClassificationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchEmailClassificationQueue();
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load email classification queue"
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
  }, []);

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
        emails: [],
      });

      try {
        const detail = await fetchEmailClassificationDetail(candidateId);
        if (!cancelled) setSelectedDetail(detail);
      } catch (loadError) {
        if (!cancelled) {
          setDetailError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load email classification detail"
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

  return (
    <div className="px-8 py-8">
      <HumanReviewBackLink
        title="Email Classification"
        subtitle="Contacts with uncertain email classification waiting for review"
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company or website..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
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
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
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
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-gray-500"
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
                    className={`cursor-pointer border-b border-gray-50 last:border-b-0 transition hover:bg-gray-50/60 ${
                      selected ? "bg-violet-50/60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-violet-600">
                      {item.id}
                    </td>
                    <td
                      className="truncate px-6 py-4 text-sm font-semibold text-gray-900"
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
                          className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700"
                        >
                          <span className="truncate">{item.website}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
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
        <EmailClassificationDetailPanel
          detail={selectedDetail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
