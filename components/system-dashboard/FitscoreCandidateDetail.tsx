"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type {
  FitscoreCandidate,
  FitscoreRequirementResult,
} from "@/lib/api/system-dashboard-client";
import { FitscoreStatusBadge } from "./SystemDashboardShared";

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

function parseSupportingFactsItems(
  value: FitscoreRequirementResult["supporting_facts"]
): string[] {
  if (value == null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      return normalizeSupportingFacts(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  return normalizeSupportingFacts(value);
}

function normalizeSupportingFacts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item == null) return "";
        return String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "object" && value !== null) {
    const values = Object.values(value as Record<string, unknown>);
    if (values.length > 0) {
      return values.flatMap((item) => normalizeSupportingFacts(item));
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [String(value)];
}

function SupportingFactsList({
  facts,
}: {
  facts: FitscoreRequirementResult["supporting_facts"];
}) {
  const items = parseSupportingFactsItems(facts);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">—</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
      {items.map((fact, index) => (
        <li key={index}>{fact}</li>
      ))}
    </ul>
  );
}

function RequirementStatusBadge({ status }: { status: string }) {
  if (status === "accepted" || status === "rejected" || status === "failed") {
    return <FitscoreStatusBadge status={status} />;
  }

  return <span className="font-medium capitalize">{status}</span>;
}

export function FitscoreCandidateDetail({
  candidate,
  loading = false,
  error = null,
  onClose,
}: {
  candidate: FitscoreCandidate | null;
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
        aria-labelledby="fitscore-detail-title"
        className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {candidate.id}
            </p>
            <h2
              id="fitscore-detail-title"
              className="mt-1 text-lg font-semibold text-gray-900"
            >
              {candidate.company}
            </h2>
            {candidate.website ? (
              <p className="mt-1 text-sm text-gray-500">{candidate.website}</p>
            ) : null}
            <div className="mt-2">
              <FitscoreStatusBadge status={candidate.status} />
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
                Fit scores grouped by requirement ({candidate.requirements.length})
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
                        <RequirementStatusBadge status={req.status} />
                      </DetailField>
                      <DetailField label="Score">
                        {req.score != null ? (
                          <span className="font-mono font-semibold tabular-nums">
                            {req.score}
                          </span>
                        ) : (
                          "—"
                        )}
                      </DetailField>
                      <div className="sm:col-span-2">
                        <DetailField label="Reason">{req.reason || "—"}</DetailField>
                      </div>
                    </dl>

                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Supporting facts
                      </p>
                      <SupportingFactsList facts={req.supporting_facts} />
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
