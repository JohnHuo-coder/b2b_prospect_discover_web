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
  contact_role: string | null;
  from: string | null;
  outreach_email: string | null;
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

export type LeadContact = {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  contactRole: string;
  linkedinUrl: string;
  outreachEmail: string;
};

export type LeadDetail = {
  id: string;
  companyName: string;
  website: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  requirements: LeadRequirement[];
  contacts: LeadContact[];
};

const KNOWN_STATUSES = new Set<LeadStatus>([
  "sent",
  "heard_back",
  "pending",
  "rejected",
]);

function normalizeStatus(status: string): LeadStatus {
  if (KNOWN_STATUSES.has(status as LeadStatus)) {
    return status as LeadStatus;
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

function normalizeWebsite(value: string | null): string {
  return (value ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
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

function mapLeadDetail(data: LeadDetailResponse): LeadDetail {
  const info = data.lead_info;

  return {
    id: String(info.id),
    companyName: info.company_name,
    website: normalizeWebsite(info.website),
    phone: info.phone?.trim() || "—",
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
      contactRole: row.contact_role?.trim() || "—",
      linkedinUrl: row.linkedin_url?.trim() || "",
      outreachEmail: row.outreach_email?.trim() || "",
    })),
  };
}

export async function fetchLeadById(id: string): Promise<LeadDetail> {
  const response = await authenticatedFetch(ENDPOINTS.leadDetail(id));

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load lead"
    );
  }

  const data = (await response.json()) as LeadDetailResponse;
  return mapLeadDetail(data);
}
