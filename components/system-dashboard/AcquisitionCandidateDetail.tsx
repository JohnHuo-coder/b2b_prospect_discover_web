"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type {
  AcquisitionCandidate,
  AcquisitionRequirementResult,
} from "@/lib/api/system-dashboard-client";
import { AcquisitionStatusBadge } from "./SystemDashboardShared";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-700">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

const missMetricMeta = [
  {
    key: "has_url_no_web_content_miss" as const,
    label: "Empty page on scrape",
    description:
      "Scraped by URL, but the page returned no usable content.",
  },
  {
    key: "no_best_url_subset_miss" as const,
    label: "No URL selected from top candidates",
    description:
      "Top-scoring URLs were offered for this requirement, but the LLM selected none.",
  },
  {
    key: "no_facts_extracted_miss" as const,
    label: "No useful facts extracted",
    description:
      "The page had content, but LLM compression found no facts relevant to this requirement.",
  },
  {
    key: "insufficient_content_miss" as const,
    label: "Insufficient facts for evaluation",
    description:
      "The LLM judged the extracted facts too sparse to evaluate this requirement.",
  },
];

function MissMetricsSection({ req }: { req: AcquisitionRequirementResult }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Issue counts
      </p>
      <div className="divide-y divide-gray-100">
        {missMetricMeta.map((metric) => {
          const count = req[metric.key];

          return (
            <div key={metric.key} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                <span
                  className={`shrink-0 font-mono text-base font-semibold tabular-nums ${
                    count > 0 ? "text-violet-600" : "text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AcquisitionCandidateDetail({
  candidate,
  loading = false,
  error = null,
  onClose,
}: {
  candidate: AcquisitionCandidate | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!candidate) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [candidate, onClose]);

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close detail panel"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="acquisition-detail-title"
        className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {candidate.id}
            </p>
            <h2
              id="acquisition-detail-title"
              className="mt-1 text-lg font-semibold text-gray-900"
            >
              {candidate.company}
            </h2>
            <div className="mt-2">
              <AcquisitionStatusBadge status={candidate.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-sm text-gray-500">Loading requirement details...</p>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : candidate.requirements.length === 0 ? (
            <p className="text-sm text-gray-500">No requirement details found.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">
                Results grouped by requirement ({candidate.requirements.length})
              </p>

              <div className="space-y-4">
                {candidate.requirements.map((req) => (
                  <section
                    key={req.requirement_index}
                    className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
                  >
                    <div className="mb-4 border-b border-gray-200 pb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                        Requirement {req.requirement_index}
                      </p>
                      {req.requirement_text ? (
                        <p className="mt-1 text-sm leading-relaxed text-gray-700">
                          {req.requirement_text}
                        </p>
                      ) : null}
                    </div>

                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <DetailField label="Status">
                        <span className="font-medium capitalize">{req.status}</span>
                      </DetailField>
                      <DetailField label="Final stage">
                        <span className="font-mono text-xs">{req.final_stage}</span>
                      </DetailField>
                      <div className="sm:col-span-2">
                        <DetailField label="Reason">{req.reason}</DetailField>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <MissMetricsSection req={req} />
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
