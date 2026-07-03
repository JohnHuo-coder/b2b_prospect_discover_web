import type { BusinessConfigState } from "@/lib/types/business-config";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

const base = ENDPOINTS.BUSINESS_CONFIG;

type BusinessConfigRow = {
  business_id?: number | string | null;
  business_name?: string | null;
  sender_name?: string | null;
  collaboration_intent?: string | null;
  search_keyword?: string | null;
  search_location?: string | null;
  number_of_candidates_per_run?: number | null;
  min_words?: number | null;
  max_words?: number | null;
  low_conf_cutoff_email_classification?: number | null;
  qualified_conf_email_classification?: number | null;
  fit_score_cutoff?: number | null;
  contact_titles?: string[] | null;
  contact_categories?: string[] | null;
};

type RequirementRow = {
  clarified?: string | null;
  req_index?: number | null;
};

type BusinessConfigResponse = {
  business_config: BusinessConfigRow | null;
  business_requirements: RequirementRow[];
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function mapBusinessConfigResponse(
  data: BusinessConfigResponse
): BusinessConfigState {
  const cfg = data.business_config ?? {};
  const requirements = (data.business_requirements ?? [])
    .slice()
    .sort((a, b) => (a.req_index ?? 0) - (b.req_index ?? 0))
    .map((row) => row.clarified?.trim())
    .filter((value): value is string => Boolean(value));

  return {
    business_id: toStringValue(cfg.business_id),
    business_name: toStringValue(cfg.business_name),
    sender_name: toStringValue(cfg.sender_name),
    sender_email: "",
    collaboration_intent: toStringValue(cfg.collaboration_intent),
    requirements,
    latitude: "",
    longitude: "",
    max_distance: "",
    fit_score_cutoff: toNumber(cfg.fit_score_cutoff),
    low_conf_cutoff_email_classification:
      toNumber(cfg.low_conf_cutoff_email_classification),
    qualified_conf_email_classification:
      toNumber(cfg.qualified_conf_email_classification),
    search_keyword: toStringValue(cfg.search_keyword),
    search_location: toStringValue(cfg.search_location),
    contact_titles: toStringArray(cfg.contact_titles),
    contact_categories: toStringArray(cfg.contact_categories),
    min_words: toNumber(cfg.min_words),
    max_words: toNumber(cfg.max_words),
    number_of_candidates_per_run: toNumber(cfg.number_of_candidates_per_run),
    test_mode: null,
    test_email_override: "",
    follow_up_delay: "",
    excluded_partners: [],
  };
}

async function patchConfig<T>(path: string, body: T) {
  const response = await authenticatedFetch(`${base}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string" ? error.error : "Failed to save configuration"
    );
  }

  return response.json();
}

export async function fetchBusinessConfig(): Promise<BusinessConfigState> {
  const response = await authenticatedFetch(base);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to load configuration"
    );
  }

  const data = (await response.json()) as BusinessConfigResponse;
  return mapBusinessConfigResponse(data);
}

export function saveBusinessProfile(body: {
  business_name: string;
  sender_name: string;
  collaboration_intent: string;
}) {
  return patchConfig("/profile", body);
}

export function saveClassificationCutoffs(body: {
  fit_score_cutoff: number;
  low_conf_cutoff_email_classification: number;
  qualified_conf_email_classification: number;
}) {
  return patchConfig("/cutoffs", body);
}

export function saveSearchConfig(body: {
  search_keyword: string;
  search_location: string;
}) {
  return patchConfig("/search", body);
}

export function saveRunSettings(body: {
  number_of_candidates_per_run: number;
  min_words: number;
  max_words: number;
}) {
  return patchConfig("/run-settings", body);
}

export function saveContactFilters(body: {
  contact_titles: string[];
  contact_categories: string[];
}) {
  return patchConfig("/contact-filters", body);
}

export function saveRequirements(body: { requirements: string[] }) {
  return patchConfig("/requirements", body);
}

export type RephraseSuggestion = {
  clarified: string;
  reason?: string;
};

export async function rephraseRequirements(
  requirements: string[]
): Promise<RephraseSuggestion[]> {
  const response = await authenticatedFetch(
    ENDPOINTS.BUSINESS_CONFIG_REPHRASE,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirements }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to rephrase requirements"
    );
  }

  if (Array.isArray(data.suggestions)) {
    return data.suggestions
      .map((item: unknown) => {
        if (typeof item !== "object" || item === null) return null;
        const record = item as Record<string, unknown>;
        const clarified =
          typeof record.clarified === "string" ? record.clarified.trim() : "";
        if (!clarified) return null;
        const reason =
          typeof record.reason === "string" ? record.reason.trim() : undefined;
        return { clarified, reason };
      })
      .filter(
        (item: RephraseSuggestion | null): item is RephraseSuggestion =>
          item !== null
      );
  }

  throw new Error("Invalid rephrase response from server");
}

export function normalizeRequirements(requirements: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of requirements) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}
