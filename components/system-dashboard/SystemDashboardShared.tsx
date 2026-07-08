import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ContactEmailSource } from "@/lib/system-dashboard/contact-status";
import { getContactEmailSourceLabel } from "@/lib/system-dashboard/contact-status";

export function SystemDashboardBackLink({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <Link
        href="/system-dashboard"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-700"
      >
        <ChevronLeft className="h-4 w-4" />
        System Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

const outreachStatusStyles = {
  succeed: {
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Succeed",
  },
  failed: {
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Failed",
  },
  require_review: {
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Require Review",
  },
  pending: {
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Pending",
  },
  rejected: {
    text: "text-rose-700",
    dot: "bg-rose-500",
    label: "Rejected",
  },
} as const;

export function OutreachStatusBadge({
  status,
}: {
  status: keyof typeof outreachStatusStyles;
}) {
  const styles = outreachStatusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${styles.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
}

export function OutreachHumanApprovedTag() {
  return (
    <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
      Human approved
    </span>
  );
}

function formatEditSeverityLabel(severity: string): string {
  const normalized = severity.trim().toLowerCase();
  if (normalized === "major") return "Major change";
  if (normalized === "minor") return "Minor change";
  return severity;
}

export function OutreachHumanReviewDetailTags({
  modified,
  analyticStatus,
  editSeverity,
}: {
  modified?: boolean | null;
  analyticStatus?: string | null;
  editSeverity?: string | null;
}) {
  const showSeverity =
    modified === true &&
    analyticStatus?.trim().toLowerCase() === "success" &&
    Boolean(editSeverity?.trim());

  return (
    <>
      {modified === true ? (
        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
          Modified
        </span>
      ) : null}
      {modified === false ? (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          Unmodified
        </span>
      ) : null}
      {showSeverity ? (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            editSeverity?.trim().toLowerCase() === "major"
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-sky-200 bg-sky-50 text-sky-700"
          }`}
        >
          {formatEditSeverityLabel(editSeverity ?? "")}
        </span>
      ) : null}
    </>
  );
}

export function OutreachStatusWithTag({
  status,
  humanApprovedTag = false,
  humanReviewModified = null,
  humanReviewAnalyticStatus = null,
  humanReviewEditSeverity = null,
}: {
  status: keyof typeof outreachStatusStyles;
  humanApprovedTag?: boolean;
  humanReviewModified?: boolean | null;
  humanReviewAnalyticStatus?: string | null;
  humanReviewEditSeverity?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <OutreachStatusBadge status={status} />
      {humanApprovedTag ? <OutreachHumanApprovedTag /> : null}
      {humanApprovedTag ? (
        <OutreachHumanReviewDetailTags
          modified={humanReviewModified}
          analyticStatus={humanReviewAnalyticStatus}
          editSeverity={humanReviewEditSeverity}
        />
      ) : null}
    </div>
  );
}

export function ContactEmailSourceTag({
  source,
}: {
  source: ContactEmailSource;
}) {
  const styles =
    source === "apollo"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : source === "anymail_finder"
        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
        : "border-teal-200 bg-teal-50 text-teal-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles}`}
    >
      {getContactEmailSourceLabel(source)}
    </span>
  );
}

export function ContactStatusWithSource({
  status,
  emailSource = null,
}: {
  status: "succeed" | "failed";
  emailSource?: ContactEmailSource | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AcquisitionStatusBadge status={status} />
      {status === "succeed" && emailSource ? (
        <ContactEmailSourceTag source={emailSource} />
      ) : null}
    </div>
  );
}

export function AcquisitionStatusBadge({
  status,
}: {
  status: "succeed" | "failed";
}) {
  const isSuccess = status === "succeed";

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${
        isSuccess ? "text-emerald-700" : "text-red-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isSuccess ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {isSuccess ? "Succeed" : "Failed"}
    </span>
  );
}

export function PendingReviewBadge() {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

const fitscoreStatusStyles = {
  accepted: {
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Accepted",
  },
  rejected: {
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Rejected",
  },
  failed: {
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Failed",
  },
} as const;

export function FitscoreStatusBadge({
  status,
}: {
  status: "accepted" | "rejected" | "failed";
}) {
  const styles = fitscoreStatusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${styles.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
}
