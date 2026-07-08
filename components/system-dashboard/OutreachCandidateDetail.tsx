"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, ExternalLink, X } from "lucide-react";
import type { OutreachCandidate } from "@/lib/api/system-dashboard-client";
import { shouldShowComplianceReview } from "@/lib/system-dashboard/outreach-status";
import { OutreachStatusWithTag } from "./SystemDashboardShared";
import { OutreachComplianceReviewModal } from "./OutreachComplianceReviewModal";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

export function OutreachCandidateDetail({
  candidate,
  loading = false,
  error = null,
  onClose,
  onUpdated,
}: {
  candidate: OutreachCandidate | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setReviewOpen(false);
  }, [candidate?.id]);

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

  const showComplianceReview = shouldShowComplianceReview(
    candidate.final_stage,
    candidate.status
  );

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
        aria-labelledby="outreach-detail-title"
        className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {candidate.id}
            </p>
            <h2
              id="outreach-detail-title"
              className="mt-1 text-lg font-semibold text-gray-900"
            >
              {candidate.company}
            </h2>
            {candidate.website ? (
              <a
                href={
                  candidate.website.startsWith("http")
                    ? candidate.website
                    : `https://${candidate.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
              >
                {candidate.website}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <div className="mt-2">
              <OutreachStatusWithTag
                status={candidate.status}
                humanApprovedTag={candidate.human_approved_tag}
                humanReviewModified={candidate.human_review_modified}
                humanReviewAnalyticStatus={candidate.human_review_analytic_status}
                humanReviewEditSeverity={candidate.human_review_edit_severity}
              />
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
          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="status">
                <span className="font-medium capitalize">{candidate.status}</span>
              </DetailField>
              <DetailField label="final_stage">
                <span className="font-mono text-xs">
                  {candidate.final_stage || "—"}
                </span>
              </DetailField>
              <div className="sm:col-span-2">
                <DetailField label="reason">
                  <div className="max-h-40 overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {loading ? "Loading..." : candidate.reason || "—"}
                  </div>
                </DetailField>
              </div>
            </dl>
          </section>

          {showComplianceReview ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
              >
                <ClipboardCheck className="h-4 w-4" />
                Review compliance
              </button>
            </div>
          ) : null}

          <section className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Outreach emails
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading emails...</p>
            ) : candidate.emails.length === 0 ? (
              <p className="text-sm text-gray-500">No outreach emails found.</p>
            ) : (
              <div className="space-y-3">
                {candidate.emails.map((row) => (
                  <div
                    key={row.email}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {row.email}
                    </p>
                    {row.outreach_email ? (
                      <div className="mt-3 rounded-md bg-gray-50 p-3">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Draft
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
                          {row.outreach_email}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-400">
                        No draft generated.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>

      <OutreachComplianceReviewModal
        open={reviewOpen}
        candidateId={candidate.id}
        onClose={() => setReviewOpen(false)}
        onComplete={onUpdated}
      />
    </div>
  );
}
