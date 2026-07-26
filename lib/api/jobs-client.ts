import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type AutomationJobRow = {
  id: number;
  createdAt: string;
  createdAtLabel: string;
  version: number;
  status: string;
  statusLabel: string;
  prospectNumber: number | null;
  reason: string;
};

type AutomationJobApiRow = {
  id: number | string;
  created_at: string;
  version: number | string;
  status: string;
  prospect_number: number | string | null;
  reason: string | null;
};

type AutomationJobsResponse = {
  rows: AutomationJobApiRow[];
  total: number;
  page: number;
  limit: number;
};

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return "—";
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapAutomationJobRow(row: AutomationJobApiRow): AutomationJobRow {
  const status = String(row.status ?? "").trim().toLowerCase();
  const prospectRaw = row.prospect_number;
  const prospectNumber =
    prospectRaw === null || prospectRaw === undefined || prospectRaw === ""
      ? null
      : Number(prospectRaw);

  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    createdAtLabel: formatCreatedAt(String(row.created_at)),
    version: Number(row.version) || 0,
    status,
    statusLabel: formatStatusLabel(status),
    prospectNumber: Number.isFinite(prospectNumber) ? prospectNumber : null,
    reason: typeof row.reason === "string" ? row.reason.trim() : "",
  };
}

export async function fetchAutomationJobs(params?: {
  page?: number;
  limit?: number;
}): Promise<{ jobs: AutomationJobRow[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) {
    query.set("page", String(params.page));
  }
  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await authenticatedFetch(`${ENDPOINTS.JOBS}${suffix}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load automation jobs"
    );
  }

  const data = (await response.json()) as AutomationJobsResponse;

  return {
    jobs: Array.isArray(data.rows) ? data.rows.map(mapAutomationJobRow) : [],
    total: Number(data.total) || 0,
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 25,
  };
}
