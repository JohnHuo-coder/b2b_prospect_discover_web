"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import {
  fetchInfoAcquisitionStageDetail,
  type InfoAcquisitionStageDetailCandidate,
} from "@/lib/api/system-dashboard-client";
import type { PipelineNodeMeta } from "@/lib/system-dashboard/information-acquisition-pipeline-flow";
import { DataTableSection } from "../MetricCard";

const PAGE_SIZE = 25;

export function PipelineNodeCandidatesPage({
  node,
  requirementIndex,
}: {
  node: PipelineNodeMeta;
  requirementIndex: number;
}) {
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState<
    InfoAcquisitionStageDetailCandidate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [node.id, requirementIndex]);

  useEffect(() => {
    if (!node.finalStage) {
      setCandidates([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchInfoAcquisitionStageDetail({
          requirementIndex,
          finalStage: node.finalStage!,
        });
        if (cancelled) return;
        setCandidates(result.candidates);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load candidates"
        );
        setCandidates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [node.finalStage, requirementIndex]);

  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageCandidates = candidates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const pipelineHref = `/system-dashboard/information-acquisition/pipeline?requirement_index=${requirementIndex}`;

  return (
    <div className="px-6 py-6">
      <div className="mb-8">
        <Link
          href={pipelineHref}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{node.label}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Requirement {requirementIndex}
          {node.finalStage ? ` · ${node.finalStage}` : ""}
        </p>
      </div>

      {!node.finalStage ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
          This node is not tied to a workflow stage.
        </div>
      ) : (
        <>
          {error ? (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          ) : null}

          <DataTableSection
            title="Candidates"
            subtitle={
              loading
                ? "Loading candidates..."
                : `${candidates.length} failed candidates`
            }
            hint="Failed candidates stopped at this stage"
          >
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-20" />
                <col className="w-[28%]" />
                <col className="w-[22%]" />
                <col />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Website</th>
                  <th className="px-6 py-4">Reason</th>
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
                ) : pageCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No failed candidates at this stage.
                    </td>
                  </tr>
                ) : (
                  pageCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-gray-50 last:border-b-0"
                    >
                      <td className="px-6 py-4 align-top text-sm font-medium text-gray-700">
                        {candidate.id}
                      </td>
                      <td
                        className="truncate px-6 py-4 align-top text-sm font-semibold text-gray-900"
                        title={candidate.company}
                      >
                        {candidate.company}
                      </td>
                      <td className="px-6 py-4 align-top">
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
                          >
                            <span className="truncate">{candidate.website}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="max-h-32 overflow-y-auto pr-2 text-sm leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
                          {candidate.reason || "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </DataTableSection>
        </>
      )}
    </div>
  );
}
