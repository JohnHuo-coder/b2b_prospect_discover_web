import type { LeadStatus } from "@/lib/mock-data";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

type LeadInfoRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  industry: string | null;
  linkedin_url: string | null;
  employee_count: number | string | null;
  source: string | null;
  address: string | null;
  distance_km: number | string | null;
  employee_count_range_start: number | string | null;
  employee_count_range_end: number | string | null;
  company_type: string | null;
};

type LeadScoreRow = {
  score: number | string;
  reason: string | null;
  supporting_facts: unknown;
  requirement_index: number;
  clarified: string;
  req_index: number;
};

type LeadEmailRow = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  salutation_target: string | null;
  confidence_level: string | null;
  from: string | null;
  outreach_email: string | null;
  outreach_status: string | null;
};

type LeadDetailResponse = {
  lead_info: LeadInfoRow;
  lead_scores: LeadScoreRow[];
  lead_emails: LeadEmailRow[];
};

export type LeadRequirement = {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
  supportingFacts: string[];
};

export type LeadContactEmailSource = "website" | "verified" | null;

export type ContactConfidenceLevel = "high" | "medium" | "low";

export type OutreachEmailStatus = "ready" | "sent";

export type LeadContact = {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  salutationTarget: string;
  confidenceLevel: ContactConfidenceLevel | null;
  linkedinUrl: string;
  outreachEmail: string;
  outreachStatus: OutreachEmailStatus | null;
  emailSource: LeadContactEmailSource;
};

export const WEBSITE_SCRAPED_EMAIL_NOTE =
  "This email was scraped from the company website. Please use with caution.";

export type LeadDetail = {
  id: string;
  companyName: string;
  website: string | null;
  phone: string | null;
  industry: string | null;
  linkedinUrl: string | null;
  employeeCount: number | null;
  employeeCountRange: string | null;
  companyType: string | null;
  source: string | null;
  address: string | null;
  distanceKm: number | null;
  status: LeadStatus;
  createdAt: string;
  requirements: LeadRequirement[];
  contacts: LeadContact[];
};

const KNOWN_STATUSES = new Set<LeadStatus>([
  "ready",
  "sent",
  "heard_back",
  "pending",
  "rejected",
]);

function normalizeStatus(status: string): LeadStatus {
  const normalized = status.trim().toLowerCase();
  if (KNOWN_STATUSES.has(normalized as LeadStatus)) {
    return normalized as LeadStatus;
  }
  if (normalized === "review_needed") {
    return "pending";
  }
  return "pending";
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeWebsite(value: string | null): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  return trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

function normalizeOptionalNumber(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatEmployeeCountRange(
  start: number | string | null | undefined,
  end: number | string | null | undefined
): string | null {
  const rangeStart = normalizeOptionalNumber(start);
  const rangeEnd = normalizeOptionalNumber(end);

  if (rangeStart !== null && rangeEnd !== null) {
    if (rangeStart === rangeEnd) return String(rangeStart);
    return `${rangeStart} - ${rangeEnd}`;
  }

  if (rangeStart !== null) return String(rangeStart);
  if (rangeEnd !== null) return String(rangeEnd);
  return null;
}

function formatSourceLabel(value: string | null): string | null {
  if (!value) return null;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeScore(value: number | string): number {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  if (numeric > 0 && numeric <= 1) return Math.round(numeric * 100);
  return Math.round(numeric);
}

function parseSupportingFacts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      // fall through to line split
    }

    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function resolveContactEmailSource(from: string | null | undefined): LeadContactEmailSource {
  const normalized = from?.trim().toLowerCase() ?? "";
  if (normalized === "email_classification") return "website";
  if (normalized === "anymail_finder" || normalized === "apollo") return "verified";
  return null;
}

function normalizeConfidenceLevel(
  value: string | null | undefined
): ContactConfidenceLevel | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return null;
}

function normalizeOutreachStatus(
  status: string | null | undefined
): OutreachEmailStatus | null {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (normalized === "ready" || normalized === "sent") {
    return normalized;
  }
  return null;
}

function mapLeadDetail(data: LeadDetailResponse): LeadDetail {
  const info = data.lead_info;

  return {
    id: String(info.id),
    companyName: info.company_name,
    website: normalizeWebsite(info.website),
    phone: normalizeOptionalText(info.phone),
    industry: normalizeOptionalText(info.industry),
    linkedinUrl: normalizeOptionalText(info.linkedin_url),
    employeeCount: normalizeOptionalNumber(info.employee_count),
    employeeCountRange: formatEmployeeCountRange(
      info.employee_count_range_start,
      info.employee_count_range_end
    ),
    companyType: normalizeOptionalText(info.company_type),
    source: formatSourceLabel(normalizeOptionalText(info.source)),
    address: normalizeOptionalText(info.address),
    distanceKm: normalizeOptionalNumber(info.distance_km),
    status: normalizeStatus(info.status),
    createdAt: formatCreatedAt(info.created_at),
    requirements: data.lead_scores.map((row) => ({
      name: row.clarified || `Requirement ${row.req_index}`,
      score: normalizeScore(row.score),
      maxScore: 100,
      reason: row.reason?.trim() || "No reasoning provided.",
      supportingFacts: parseSupportingFacts(row.supporting_facts),
    })),
    contacts: data.lead_emails.map((row) => ({
      email: row.email,
      firstName: row.first_name?.trim() || "—",
      lastName: row.last_name?.trim() || "—",
      jobTitle: row.job_title?.trim() || "—",
      salutationTarget: row.salutation_target?.trim() || "—",
      confidenceLevel: normalizeConfidenceLevel(row.confidence_level),
      linkedinUrl: row.linkedin_url?.trim() || "",
      outreachEmail: row.outreach_email?.trim() || "",
      outreachStatus: normalizeOutreachStatus(row.outreach_status),
      emailSource: resolveContactEmailSource(row.from),
    })),
  };
}

export async function fetchLeadById(
  id: string,
  version?: number
): Promise<LeadDetail> {
  const query =
    version !== undefined ? `?version=${encodeURIComponent(String(version))}` : "";
  const response = await authenticatedFetch(`${ENDPOINTS.leadDetail(id)}${query}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load lead"
    );
  }

  const data = (await response.json()) as LeadDetailResponse;
  return mapLeadDetail(data);
}

function withVersionQuery(url: string, version?: number) {
  if (version === undefined) return url;
  return `${url}?version=${encodeURIComponent(String(version))}`;
}

export async function deleteLeadContact(
  leadId: string,
  email: string,
  version?: number
): Promise<void> {
  const response = await authenticatedFetch(withVersionQuery(ENDPOINTS.leadContact(leadId), version), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to delete contact"
    );
  }
}

export async function updateOutreachEmail(
  leadId: string,
  payload: {
    email: string;
    outreach_email?: string;
    status?: OutreachEmailStatus;
  },
  version?: number
): Promise<{ outreach_email: string; status: string }> {
  const response = await authenticatedFetch(
    withVersionQuery(ENDPOINTS.leadContactOutreach(leadId), version),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to update outreach email"
    );
  }

  return (await response.json()) as {
    outreach_email: string;
    status: string;
  };
}

export async function sendOutreachEmail(
  leadId: string,
  payload: {
    email: string;
    outreach_email?: string;
  },
  version?: number
): Promise<{ outreach_email: string; status: OutreachEmailStatus }> {
  const response = await authenticatedFetch(
    withVersionQuery(ENDPOINTS.leadContactSend(leadId), version),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(
      typeof data.error === "string" ? data.error : "Failed to send outreach email"
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as {
    outreach_email: string;
    status: string;
  };

  return {
    outreach_email: data.outreach_email,
    status: normalizeOutreachStatus(data.status) ?? "sent",
  };
}

export type BulkSendResult = {
  sent: Array<{ email: string; outreach_email: string; status: OutreachEmailStatus }>;
  failed: Array<{ email: string; error: string }>;
};

export async function sendAllOutreachEmails(
  leadId: string,
  emails: string[],
  version?: number
): Promise<BulkSendResult> {
  const sent: BulkSendResult["sent"] = [];
  const failed: BulkSendResult["failed"] = [];

  for (const email of emails) {
    try {
      const result = await sendOutreachEmail(leadId, { email }, version);
      sent.push({
        email,
        outreach_email: result.outreach_email,
        status: result.status,
      });
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 403) {
        throw error;
      }
      failed.push({
        email,
        error: error.message || "Failed to send outreach email",
      });
    }
  }

  return { sent, failed };
}
