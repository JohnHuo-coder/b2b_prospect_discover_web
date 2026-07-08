"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type {
  EmailClassificationDetail,
  EmailClassificationEmailRow,
} from "@/lib/api/human-review-client";

const CONTACT_ROLE_OPTIONS = [
  { value: "executive", label: "Executive" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Other" },
] as const;

type ContactRole = (typeof CONTACT_ROLE_OPTIONS)[number]["value"];

function normalizeContactRole(value: string | null | undefined): ContactRole {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === "executive" ||
    normalized === "sales" ||
    normalized === "marketing" ||
    normalized === "operations" ||
    normalized === "other"
  ) {
    return normalized;
  }
  return "other";
}

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

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

const fieldClassName =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

function EmailClassificationCard({ email }: { email: EmailClassificationEmailRow }) {
  const [contactRole, setContactRole] = useState<ContactRole>(() =>
    normalizeContactRole(email.contact_role)
  );
  const [firstName, setFirstName] = useState(email.likely_contact_first_name ?? "");
  const [lastName, setLastName] = useState(email.likely_contact_last_name ?? "");
  const [jobTitle, setJobTitle] = useState(email.likely_job_title ?? "");

  useEffect(() => {
    setContactRole(normalizeContactRole(email.contact_role));
    setFirstName(email.likely_contact_first_name ?? "");
    setLastName(email.likely_contact_last_name ?? "");
    setJobTitle(email.likely_job_title ?? "");
  }, [email]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-gray-900">{email.email}</p>

      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField label="Confidence score">
          {email.confidence_score === null ? "—" : `${email.confidence_score}`}
        </DetailField>
        <DetailField label="Contact role">
          <select
            value={contactRole}
            onChange={(event) =>
              setContactRole(event.target.value as ContactRole)
            }
            className={fieldClassName}
          >
            {CONTACT_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DetailField>
        <DetailField label="Likely contact first name">
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            className={fieldClassName}
          />
        </DetailField>
        <DetailField label="Likely contact last name">
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
            className={fieldClassName}
          />
        </DetailField>
        <div className="sm:col-span-2">
          <DetailField label="Likely job title">
            <input
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Job title"
              className={fieldClassName}
            />
          </DetailField>
        </div>
        <div className="sm:col-span-2">
          <DetailField label="Reason">
            <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">
              {email.reason || "—"}
            </div>
          </DetailField>
        </div>
        <div className="sm:col-span-2">
          <DetailField label="From context">
            <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">
              {formatValue(email.from_context)}
            </div>
          </DetailField>
        </div>
        <div className="sm:col-span-2">
          <DetailField label="From URL">
            {email.from_url ? (
              <a
                href={
                  email.from_url.startsWith("http")
                    ? email.from_url
                    : `https://${email.from_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 [overflow-wrap:anywhere]"
              >
                {email.from_url}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              "—"
            )}
          </DetailField>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
        >
          Discard
        </button>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Keep
        </button>
      </div>
    </div>
  );
}

export function EmailClassificationDetailPanel({
  detail,
  loading = false,
  error = null,
  onClose,
}: {
  detail: EmailClassificationDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!detail) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detail, onClose]);

  if (!detail) return null;

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
        aria-labelledby="email-classification-detail-title"
        className="relative z-10 flex h-full w-full max-w-3xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {detail.id}
            </p>
            <h2
              id="email-classification-detail-title"
              className="mt-1 text-lg font-semibold text-gray-900"
            >
              {detail.company}
            </h2>
            {detail.website ? (
              <a
                href={
                  detail.website.startsWith("http")
                    ? detail.website
                    : `https://${detail.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
              >
                {detail.website}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
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

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Emails pending review
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading email details...</p>
            ) : detail.emails.length === 0 ? (
              <p className="text-sm text-gray-500">No emails found.</p>
            ) : (
              <div className="space-y-3">
                {detail.emails.map((email) => (
                  <EmailClassificationCard key={email.email} email={email} />
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
