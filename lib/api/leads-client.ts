import type { Lead, LeadStatus } from "@/lib/mock-data";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

type LeadRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

type LeadsResponse = {
  rows: LeadRow[];
  total: number;
};

const KNOWN_STATUSES = new Set<LeadStatus>([
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

function formatAddedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapLeadRow(row: LeadRow): Lead {
  const website = (row.website ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return {
    id: String(row.id),
    company: row.company_name,
    contact: row.phone?.trim() || "—",
    website,
    status: normalizeStatus(row.status),
    added: formatAddedDate(row.created_at),
  };
}

export async function fetchLeads(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ leads: Lead[]; total: number }> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = query.size
    ? `${ENDPOINTS.LEADS}?${query.toString()}`
    : ENDPOINTS.LEADS;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load leads"
    );
  }

  const data = (await response.json()) as LeadsResponse;

  return {
    leads: data.rows.map(mapLeadRow),
    total: data.total,
  };
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<void> {
  const response = await authenticatedFetch(ENDPOINTS.leadDetail(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to update lead status"
    );
  }
}
