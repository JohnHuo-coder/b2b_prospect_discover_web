"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { HumanReviewQueueItem } from "@/lib/mock-data/human-review";
import { DataTableSection } from "@/components/system-dashboard/MetricCard";

type ColumnKey = "id" | "company" | "website" | "email" | "reason";

export function HumanReviewQueueTable({
  title,
  subtitle,
  rows,
  columns,
  searchPlaceholder = "Search by company, website or reason...",
  emptyMessage = "No items match your search.",
  hint = "Click a row to review",
}: {
  title: string;
  subtitle: string;
  rows: HumanReviewQueueItem[];
  columns: ColumnKey[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  hint?: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const haystack = [
        row.id,
        row.company,
        row.website ?? "",
        row.email ?? "",
        row.reason,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [rows, search]);

  const columnLabels: Record<ColumnKey, string> = {
    id: "ID",
    company: "Company",
    website: "Website",
    email: "Email",
    reason: "Reason",
  };

  return (
    <>
      <div className="mb-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
      </div>

      <DataTableSection title={title} subtitle={subtitle} hint={hint}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {columns.map((column) => (
                <th key={column} className="px-6 py-4">
                  {columnLabels[column]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const selected = selectedId === row.id;

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`cursor-pointer border-b border-gray-50 last:border-b-0 transition hover:bg-gray-50/60 ${
                      selected ? "bg-violet-50/60" : ""
                    }`}
                  >
                    {columns.map((column) => (
                      <td key={column} className="px-6 py-4 align-top">
                        {column === "id" ? (
                          <span className="text-sm font-medium text-violet-600">
                            {row.id}
                          </span>
                        ) : null}
                        {column === "company" ? (
                          <span
                            className="block truncate text-sm font-semibold text-gray-900"
                            title={row.company}
                          >
                            {row.company}
                          </span>
                        ) : null}
                        {column === "website" ? (
                          row.website ? (
                            <a
                              href={
                                row.website.startsWith("http")
                                  ? row.website
                                  : `https://${row.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              title={row.website}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700"
                            >
                              <span className="truncate">{row.website}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )
                        ) : null}
                        {column === "email" ? (
                          <span
                            className="block truncate text-sm text-gray-700"
                            title={row.email ?? undefined}
                          >
                            {row.email ?? "—"}
                          </span>
                        ) : null}
                        {column === "reason" ? (
                          <span
                            className="block text-sm text-gray-600 [overflow-wrap:anywhere]"
                            title={row.reason}
                          >
                            {row.reason}
                          </span>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTableSection>
    </>
  );
}
