"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import type { ContactCandidate } from "@/lib/api/system-dashboard-client";
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
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

function formatContactName(email: ContactCandidate["emails"][number]) {
  const name = [email.first_name, email.last_name].filter(Boolean).join(" ");
  return name || "—";
}

const contactMissMetrics = [
  {
    key: "selected_page_no_email_miss" as const,
    label: "Selected page with no email",
    description:
      "Times a chosen contact page was scraped but contained no usable email.",
  },
  {
    key: "email_not_confident_miss" as const,
    label: "Email below confidence threshold",
    description:
      "Times an email was found but did not meet the confidence cutoff.",
  },
];

function ContactMissMetricsSection({
  candidate,
}: {
  candidate: ContactCandidate;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Issue counts
      </p>
      <div className="divide-y divide-gray-100">
        {contactMissMetrics.map((metric) => {
          const count = candidate[metric.key];

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

export function ContactCandidateDetail({
  candidate,
  loading = false,
  error = null,
  onClose,
}: {
  candidate: ContactCandidate | null;
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
        aria-labelledby="contact-detail-title"
        className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {candidate.id}
            </p>
            <h2
              id="contact-detail-title"
              className="mt-1 text-lg font-semibold text-gray-900"
            >
              {candidate.company}
            </h2>
            {candidate.website ? (
              <p className="mt-1 text-sm text-gray-500">{candidate.website}</p>
            ) : null}
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
            <p className="text-sm text-gray-500">Loading contact details...</p>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Status">
                    <span className="font-medium capitalize">{candidate.status}</span>
                  </DetailField>
                  <DetailField label="Final stage">
                    <span className="font-mono text-xs">
                      {candidate.final_stage || "—"}
                    </span>
                  </DetailField>
                  <div className="sm:col-span-2">
                    <DetailField label="Reason">
                      {candidate.reason || "—"}
                    </DetailField>
                  </div>
                  <div className="sm:col-span-2">
                    <DetailField label="Fallback from">
                      {candidate.fallback_from ? (
                        <span className="font-mono text-xs">
                          {candidate.fallback_from}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </DetailField>
                  </div>
                </dl>

                <div className="mt-4">
                  <ContactMissMetricsSection candidate={candidate} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Emails ({candidate.emails.length})
                </p>

                {candidate.emails.length === 0 ? (
                  <p className="text-sm text-gray-500">No emails found.</p>
                ) : (
                  <div className="space-y-3">
                    {candidate.emails.map((email) => (
                      <div
                        key={`${email.email}-${email.from ?? "unknown"}`}
                        className="rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {email.email}
                        </p>
                        <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <DetailField label="Name">
                            {formatContactName(email)}
                          </DetailField>
                          <DetailField label="Job title">
                            {email.job_title || "—"}
                          </DetailField>
                          <DetailField label="Contact role">
                            {email.contact_role || "—"}
                          </DetailField>
                          <DetailField label="Source">
                            {email.from || "—"}
                          </DetailField>
                          <div className="sm:col-span-2">
                            <DetailField label="LinkedIn">
                              {email.linkedin_url ? (
                                <a
                                  href={email.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700"
                                >
                                  {email.linkedin_url}
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : (
                                "—"
                              )}
                            </DetailField>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
