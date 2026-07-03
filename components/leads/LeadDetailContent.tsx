"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/ConfigCard";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { fetchLeadById, type LeadContact, type LeadDetail } from "@/lib/api/lead-detail-client";
import { useUser } from "@/components/providers/UserProvider";

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
}: {
  contact: LeadContact;
  onViewEmail: (contact: LeadContact) => void;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white px-6 py-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          <Mail className="h-4 w-4" />
          {contact.email}
        </a>

        {contact.outreachEmail ? (
          <button
            type="button"
            onClick={() => onViewEmail(contact)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            View Outreach Email
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First Name" value={contact.firstName} />
        <Field label="Last Name" value={contact.lastName} />
        <Field label="Job Title" value={contact.jobTitle} />
        <Field label="Contact Role" value={contact.contactRole} />
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
      </div>
    </article>
  );
}

export function LeadDetailContent({ leadId }: { leadId: string }) {
  const { user, isLoading: authLoading } = useUser();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState("");
  const [emailContact, setEmailContact] = useState<LeadContact | null>(null);

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
        const result = await fetchLeadById(leadId);
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
  }, [authLoading, user, leadId]);

  const isLoading = !error && lead === null && (authLoading || Boolean(user));
  const websiteHref = lead?.website
    ? lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`
    : "";

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

          <section className="rounded-xl border border-gray-200 bg-white px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">Overview</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Website"
                value={
                  lead.website ? (
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
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Phone"
                value={
                  lead.phone !== "—" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {lead.phone}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </section>

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
              <h2 className="text-base font-semibold text-gray-900">Contact</h2>
              {lead.contacts.map((contact) => (
                <ContactCard
                  key={contact.email}
                  contact={contact}
                  onViewEmail={setEmailContact}
                />
              ))}
            </section>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={Boolean(emailContact)}
        title="Outreach Email"
        onClose={() => setEmailContact(null)}
        size="lg"
      >
        {emailContact ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">To: {emailContact.email}</p>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
              {emailContact.outreachEmail}
            </pre>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
