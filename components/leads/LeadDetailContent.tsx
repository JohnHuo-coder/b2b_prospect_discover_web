"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/ConfigCard";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { OutreachEmailModal } from "@/components/leads/OutreachEmailModal";
import { useGmailStatus } from "@/components/dashboard/GmailConnectionButton";
import {
  fetchLeadById,
  deleteLeadContact,
  sendAllOutreachEmails,
  WEBSITE_SCRAPED_EMAIL_NOTE,
  type ContactConfidenceLevel,
  type LeadContact,
  type LeadDetail,
} from "@/lib/api/lead-detail-client";
import { startGmailConnect } from "@/lib/api/gmail-client";
import { useUser } from "@/components/providers/UserProvider";

type OverviewField = {
  key: string;
  label: string;
  value: ReactNode;
};

function formatDistanceKm(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} km`;
}

function buildOverviewFields(lead: LeadDetail, websiteHref: string): OverviewField[] {
  const fields: OverviewField[] = [];

  if (lead.website) {
    fields.push({
      key: "website",
      label: "Website",
      value: (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700"
        >
          <Globe className="h-4 w-4" />
          {lead.website}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ),
    });
  }

  if (lead.phone) {
    fields.push({
      key: "phone",
      label: "Phone",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-gray-400" />
          {lead.phone}
        </span>
      ),
    });
  }

  if (lead.industry) {
    fields.push({ key: "industry", label: "Industry", value: lead.industry });
  }

  if (lead.linkedinUrl) {
    const href = lead.linkedinUrl.startsWith("http")
      ? lead.linkedinUrl
      : `https://${lead.linkedinUrl}`;

    fields.push({
      key: "linkedin",
      label: "LinkedIn",
      value: (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700"
        >
          <ExternalLink className="h-4 w-4" />
          View profile
        </a>
      ),
    });
  }

  if (lead.companyType) {
    fields.push({ key: "companyType", label: "Company Type", value: lead.companyType });
  }

  if (lead.employeeCount !== null) {
    fields.push({
      key: "employeeCount",
      label: "Employee Count",
      value: String(lead.employeeCount),
    });
  }

  if (lead.employeeCountRange) {
    fields.push({
      key: "employeeCountRange",
      label: "Employee Count Range",
      value: lead.employeeCountRange,
    });
  }

  if (lead.source) {
    fields.push({ key: "source", label: "Source", value: lead.source });
  }

  if (lead.address) {
    fields.push({ key: "address", label: "Address", value: lead.address });
  }

  if (lead.distanceKm !== null) {
    fields.push({
      key: "distanceKm",
      label: "Distance",
      value: formatDistanceKm(lead.distanceKm),
    });
  }

  return fields;
}

const CONFIDENCE_LEVEL_STYLES: Record<
  ContactConfidenceLevel,
  { badge: string; dot: string }
> = {
  high: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  medium: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  low: {
    badge: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
};

function ConfidenceLevelBadge({ level }: { level: ContactConfidenceLevel }) {
  const style = CONFIDENCE_LEVEL_STYLES[level];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold capitalize ${style.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {level}
    </span>
  );
}

function RequirementCard({
  name,
  score,
  maxScore,
  reason,
  supportingFacts,
}: LeadDetail["requirements"][number]) {
  const percent = Math.min(Math.max((score / maxScore) * 100, 0), 100);

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-6 py-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-gray-900">{name}</h3>
        <span className="text-lg font-bold text-emerald-600">
          {score}/{maxScore}
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm leading-6 text-gray-700">{reason}</p>

      {supportingFacts.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {supportingFacts.map((fact) => (
            <li
              key={fact}
              className="flex items-start gap-2.5 text-sm text-gray-700"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ContactCard({
  contact,
  onViewEmail,
  onDelete,
  deleting,
  selected = false,
  onToggleSelect,
  bulkSending = false,
}: {
  contact: LeadContact;
  onViewEmail: (contact: LeadContact) => void;
  onDelete: (contact: LeadContact) => void;
  deleting: boolean;
  selected?: boolean;
  onToggleSelect?: (contact: LeadContact) => void;
  bulkSending?: boolean;
}) {
  const isSelectable =
    contact.outreachStatus === "ready" && Boolean(contact.outreachEmail);

  return (
    <article
      className={`rounded-xl border bg-white px-6 py-5 ${
        selected ? "border-violet-300 ring-2 ring-violet-100" : "border-gray-200"
      }`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {isSelectable ? (
              <input
                type="checkbox"
                checked={selected}
                disabled={bulkSending}
                onChange={() => onToggleSelect?.(contact)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed"
                aria-label={`Select ${contact.email}`}
              />
            ) : null}
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{contact.email}</span>
            </a>
            {contact.emailSource === "verified" ? (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Verified
              </span>
            ) : null}
          </div>
          {contact.emailSource === "website" ? (
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-gray-500">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{WEBSITE_SCRAPED_EMAIL_NOTE}</span>
            </p>
          ) : null}
          {contact.outreachStatus ? (
            <StatusBadge status={contact.outreachStatus} />
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {contact.outreachEmail ? (
            <button
              type="button"
              onClick={() => onViewEmail(contact)}
              disabled={bulkSending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              View Outreach Email
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(contact)}
            disabled={deleting || bulkSending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {contact.emailSource === "website" ? (
          <>
            <Field label="Contact Label" value={contact.contactLabel} />
            {contact.confidenceLevel ? (
              <Field
                label="Confidence Level"
                value={<ConfidenceLevelBadge level={contact.confidenceLevel} />}
              />
            ) : null}
          </>
        ) : (
          <>
            <Field label="First Name" value={contact.firstName} />
            <Field label="Last Name" value={contact.lastName} />
            <Field label="Job Title" value={contact.jobTitle} />
            <Field
              label="LinkedIn"
              value={
                contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View profile
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </>
        )}
      </div>
    </article>
  );
}

export function LeadDetailContent({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const configVersion = Number(user?.config_version) || 0;
  const { status: gmailStatus, loading: gmailLoading } = useGmailStatus();
  const [viewVersion, setViewVersion] = useState<number | undefined>(undefined);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState("");
  const [emailContact, setEmailContact] = useState<LeadContact | null>(null);
  const [autoSendOutreach, setAutoSendOutreach] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<LeadContact | null>(
    null
  );
  const [deletingContactEmail, setDeletingContactEmail] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSendMessage, setBulkSendMessage] = useState("");
  const [bulkSendError, setBulkSendError] = useState("");
  const [pendingBulkSendEmails, setPendingBulkSendEmails] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const versionParam = params.get("version")?.trim();
    if (!versionParam) {
      setViewVersion(undefined);
      return;
    }

    const parsed = Number.parseInt(versionParam, 10);
    if (
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      parsed <= configVersion
    ) {
      setViewVersion(parsed);
      return;
    }

    setViewVersion(undefined);
  }, [leadId, configVersion]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("Please sign in to view this lead.");
      setLead(null);
      return;
    }

    let cancelled = false;

    const loadLead = async () => {
      setLead(null);
      setError("");

      try {
        const result = await fetchLeadById(leadId, viewVersion);
        if (!cancelled) {
          setLead(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lead");
          setLead(null);
        }
      }
    };

    void loadLead();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, leadId, viewVersion]);

  useEffect(() => {
    if (!lead || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const contactEmail = params.get("contactEmail")?.trim();
    const contactEmailsParam = params.get("contactEmails")?.trim();
    const shouldAutoSend = params.get("autoSend") === "1";
    const shouldAutoBulkSend = params.get("autoBulkSend") === "1";

    if (shouldAutoBulkSend && contactEmailsParam) {
      const emails = contactEmailsParam
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
      if (emails.length > 0) {
        setSelectedEmails(emails);
        setPendingBulkSendEmails(emails);
      }
      router.replace(
        viewVersion !== undefined
          ? `/leads/${leadId}?version=${viewVersion}`
          : `/leads/${leadId}`
      );
      return;
    }

    if (!contactEmail) return;

    const matchedContact = lead.contacts.find(
      (contact) => contact.email === contactEmail
    );

    if (matchedContact) {
      setEmailContact(matchedContact);
      setAutoSendOutreach(shouldAutoSend);
    }

    router.replace(
      viewVersion !== undefined
        ? `/leads/${leadId}?version=${viewVersion}`
        : `/leads/${leadId}`
    );
  }, [lead, leadId, router, viewVersion]);

  const readyContacts =
    lead?.contacts.filter(
      (contact) =>
        contact.outreachStatus === "ready" && Boolean(contact.outreachEmail)
    ) ?? [];

  const applyContactUpdates = (
    contactEmail: string,
    updates: Partial<LeadContact>
  ) => {
    setLead((current) => {
      if (!current) return current;

      const shouldMarkLeadSent =
        updates.outreachStatus === "sent" && current.status === "ready";

      return {
        ...current,
        status: shouldMarkLeadSent ? "sent" : current.status,
        contacts: current.contacts.map((contact) =>
          contact.email === contactEmail ? { ...contact, ...updates } : contact
        ),
      };
    });

    setEmailContact((current) =>
      current?.email === contactEmail ? { ...current, ...updates } : current
    );
  };

  const runBulkSend = async (emails: string[]) => {
    if (emails.length === 0 || bulkSending) return;

    if (!gmailStatus?.connected) {
      startGmailConnect({
        returnTo: `/leads/${leadId}`,
        leadId,
        contactEmails: emails,
        autoBulkSend: true,
      });
      return;
    }

    setBulkSending(true);
    setBulkSendError("");
    setBulkSendMessage("");

    let redirectedToOAuth = false;

    try {
      const result = await sendAllOutreachEmails(leadId, emails, viewVersion);

      for (const item of result.sent) {
        applyContactUpdates(item.email, {
          outreachEmail: item.outreach_email,
          outreachStatus: item.status,
        });
      }

      setSelectedEmails((current) =>
        current.filter((email) => !result.sent.some((item) => item.email === email))
      );

      if (result.sent.length > 0 && result.failed.length === 0) {
        setBulkSendMessage(
          result.sent.length === 1
            ? "1 email sent successfully."
            : `${result.sent.length} emails sent successfully.`
        );
      } else if (result.sent.length > 0 && result.failed.length > 0) {
        setBulkSendMessage(
          `${result.sent.length} sent, ${result.failed.length} failed.`
        );
        setBulkSendError(
          result.failed.map((item) => `${item.email}: ${item.error}`).join(" ")
        );
      } else if (result.failed.length > 0) {
        setBulkSendError(
          result.failed.map((item) => `${item.email}: ${item.error}`).join(" ")
        );
      }
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 403) {
        redirectedToOAuth = true;
        startGmailConnect({
          returnTo: `/leads/${leadId}`,
          leadId,
          contactEmails: emails,
          autoBulkSend: true,
        });
        return;
      }
      setBulkSendError(error.message || "Failed to send outreach emails");
    } finally {
      setBulkSending(false);
      if (!redirectedToOAuth) {
        setPendingBulkSendEmails([]);
      }
    }
  };

  useEffect(() => {
    if (
      pendingBulkSendEmails.length === 0 ||
      bulkSending ||
      gmailLoading ||
      !gmailStatus?.connected
    ) {
      return;
    }

    void runBulkSend(pendingBulkSendEmails);
  }, [
    pendingBulkSendEmails,
    bulkSending,
    gmailLoading,
    gmailStatus?.connected,
    leadId,
  ]);

  const isLoading = !error && lead === null && (authLoading || Boolean(user));
  const websiteHref = lead?.website
    ? lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`
    : "";
  const overviewFields = lead ? buildOverviewFields(lead, websiteHref) : [];

  const handleContactUpdated = applyContactUpdates;

  const handleSelectReadyEmails = () => {
    const readyEmails = readyContacts.map((contact) => contact.email);
    if (readyEmails.length === 0) return;

    const allReadySelected = readyEmails.every((email) =>
      selectedEmails.includes(email)
    );

    if (allReadySelected) {
      setSelectedEmails([]);
      return;
    }

    setSelectedEmails(readyEmails);
    setBulkSendError("");
    setBulkSendMessage("");
  };

  const handleToggleContactSelect = (contact: LeadContact) => {
    setSelectedEmails((current) => {
      if (current.includes(contact.email)) {
        return current.filter((email) => email !== contact.email);
      }
      return [...current, contact.email];
    });
  };

  const handleSendAll = () => {
    void runBulkSend(selectedEmails);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete || !lead) return;

    setDeletingContactEmail(contactToDelete.email);
    setDeleteError("");

    try {
      await deleteLeadContact(leadId, contactToDelete.email, viewVersion);
      setLead((current) =>
        current
          ? {
              ...current,
              contacts: current.contacts.filter(
                (item) => item.email !== contactToDelete.email
              ),
            }
          : current
      );
      if (emailContact?.email === contactToDelete.email) {
        setEmailContact(null);
        setAutoSendOutreach(false);
      }
      setContactToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete contact"
      );
    } finally {
      setDeletingContactEmail(null);
    }
  };

  return (
    <div className="px-8 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-violet-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          <div>
            <SkeletonBar className="h-9 w-72 max-w-full" />
            <SkeletonBar className="mt-3 h-5 w-48" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
            <SkeletonBar className="h-5 w-24" />
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SkeletonBar className="h-12 w-full" />
              <SkeletonBar className="h-12 w-full" />
            </div>
          </div>
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-56 w-full" />
        </div>
      ) : null}

      {lead ? (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">{lead.companyName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <StatusBadge status={lead.status} />
              <span className="text-sm text-gray-500">Added {lead.createdAt}</span>
            </div>
          </header>

          {overviewFields.length > 0 ? (
            <section className="rounded-xl border border-gray-200 bg-white px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">Overview</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {overviewFields.map((field) => (
                  <Field key={field.key} label={field.label} value={field.value} />
                ))}
              </div>
            </section>
          ) : null}

          {lead.requirements.length > 0 ? (
            <div className="space-y-4">
              {lead.requirements.map((requirement, index) => (
                <RequirementCard
                  key={`${requirement.name}-${index}`}
                  {...requirement}
                />
              ))}
            </div>
          ) : null}

          {lead.contacts.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-gray-900">Contact</h2>
                {readyContacts.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectReadyEmails}
                      disabled={bulkSending}
                      className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Select ready emails
                    </button>
                    <button
                      type="button"
                      onClick={handleSendAll}
                      disabled={
                        bulkSending || selectedEmails.length === 0 || gmailLoading
                      }
                      className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {bulkSending
                        ? `Sending${selectedEmails.length > 0 ? ` (${selectedEmails.length})` : ""}...`
                        : `Send all${selectedEmails.length > 0 ? ` (${selectedEmails.length})` : ""}`}
                    </button>
                  </div>
                ) : null}
              </div>

              {bulkSendMessage ? (
                <p className="text-sm text-emerald-600">{bulkSendMessage}</p>
              ) : null}
              {bulkSendError ? (
                <p className="text-sm text-red-600">{bulkSendError}</p>
              ) : null}
              {bulkSending ? (
                <p className="text-sm text-gray-500">
                  Sending outreach emails via Gmail. Please wait.
                </p>
              ) : null}

              {lead.contacts.map((contact) => (
                <ContactCard
                  key={contact.email}
                  contact={contact}
                  selected={selectedEmails.includes(contact.email)}
                  onToggleSelect={handleToggleContactSelect}
                  bulkSending={bulkSending}
                  onViewEmail={(selectedContact) => {
                    setAutoSendOutreach(false);
                    setEmailContact(selectedContact);
                  }}
                  onDelete={setContactToDelete}
                  deleting={deletingContactEmail === contact.email}
                />
              ))}
            </section>
          ) : null}
        </div>
      ) : null}

      <OutreachEmailModal
        open={Boolean(emailContact)}
        leadId={leadId}
        configVersion={viewVersion}
        contact={emailContact}
        gmailStatus={gmailStatus}
        gmailLoading={gmailLoading}
        autoSend={autoSendOutreach}
        onClose={() => {
          setEmailContact(null);
          setAutoSendOutreach(false);
        }}
        onUpdated={handleContactUpdated}
      />

      <Modal
        open={Boolean(contactToDelete)}
        title="Delete contact?"
        onClose={() => {
          if (deletingContactEmail) return;
          setContactToDelete(null);
          setDeleteError("");
        }}
        footer={
          contactToDelete ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setContactToDelete(null);
                  setDeleteError("");
                }}
                disabled={Boolean(deletingContactEmail)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteContact()}
                disabled={Boolean(deletingContactEmail)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingContactEmail ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          ) : null
        }
      >
        {contactToDelete ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-900">
                  This action is permanent and cannot be undone.
                </p>
                <p className="text-sm leading-6 text-red-800">
                  The contact and any associated outreach data will be removed
                  immediately.
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-gray-700">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {contactToDelete.email}
              </span>
              ?
            </p>
            {deleteError ? (
              <p className="text-sm text-red-600">{deleteError}</p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
