"use client";

import { useCallback, useEffect, useState } from "react";
import { Info } from "lucide-react";
import { fetchAutomationJobs, type AutomationJobRow } from "@/lib/api/jobs-client";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonBar } from "@/components/ui/SkeletonBar";

const JOBS_PAGE_SIZE = 25;

const statusStyles: Record<string, { dot: string; text: string }> = {
  running: { dot: "bg-blue-500", text: "text-blue-700" },
  queued: { dot: "bg-amber-500", text: "text-amber-700" },
  completed: { dot: "bg-emerald-500", text: "text-emerald-700" },
  failed: { dot: "bg-red-500", text: "text-red-700" },
  cancelled: { dot: "bg-zinc-400", text: "text-zinc-600" },
};

function JobStatusBadge({ status, label }: { status: string; label: string }) {
  const style = statusStyles[status] ?? {
    dot: "bg-amber-500",
    text: "text-amber-700",
  };

  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

export function JobsContent() {
  const [jobs, setJobs] = useState<AutomationJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAutomationJobs({
        page: nextPage,
        limit: JOBS_PAGE_SIZE,
      });
      setJobs(result.jobs);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      setJobs([]);
      setTotal(0);
      setError(
        err instanceof Error ? err.message : "Failed to load automation jobs"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs(1);
  }, [loadJobs]);

  const totalPages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE));

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950">Jobs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Automation jobs for your company&apos;s prospect discovery runs.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p className="text-sm leading-relaxed text-blue-900">
          This site is in a testing phase, so only a small number of workflows
          can run at the same time across all companies. Please limit each
          company to at most 2 discovery runs per day for the best experience.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                {[
                  "Created At",
                  "Version",
                  "Status",
                  "Prospect Number",
                  "Reason",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-6 py-4" colSpan={5}>
                      <SkeletonBar className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-zinc-500"
                    colSpan={5}
                  >
                    No automation jobs yet.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-950">
                      {job.createdAtLabel}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-950">
                      {job.version}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <JobStatusBadge status={job.status} label={job.statusLabel} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-950">
                      {job.prospectNumber ?? "—"}
                    </td>
                    <td className="max-w-md px-6 py-4 text-sm text-zinc-600">
                      <span className="line-clamp-2" title={job.reason || undefined}>
                        {job.reason || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalPages > 1 ? (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={JOBS_PAGE_SIZE}
            loading={loading}
            onPageChange={(nextPage) => void loadJobs(nextPage)}
          />
        </div>
      ) : null}
    </div>
  );
}
