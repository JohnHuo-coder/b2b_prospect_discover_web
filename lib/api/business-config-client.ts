import type { BusinessConfigState } from "@/lib/types/business-config";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import {
  resolveContactTitles,
  resolveRunSettings,
} from "@/lib/constants/config-defaults";
import { normalizeContactCategories } from "@/lib/constants/contact-categories";
import type { BusinessConfigSavePayload } from "@/lib/types/business-config";

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
  has_distance_requirement?: boolean | null;
  lat?: number | null;
  lon?: number | null;
  max_distance_km?: number | null;
};

type RequirementRow = {
  clarified?: string | null;
  req_index?: number | null;
};

type BusinessConfigResponse = {
  version?: number | null;
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

function toBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  return null;
}

export function mapBusinessConfigResponse(
  data: BusinessConfigResponse
): BusinessConfigState {
  const cfg = data.business_config ?? {};
  const version = toNumber(data.version) ?? 0;
  const requirements = (data.business_requirements ?? [])
    .slice()
    .sort((a, b) => (a.req_index ?? 0) - (b.req_index ?? 0))
    .map((row) => row.clarified?.trim())
    .filter((value): value is string => Boolean(value));

  const contact_titles = resolveContactTitles(toStringArray(cfg.contact_titles));
  const runSettings = resolveRunSettings({
    min_words: toNumber(cfg.min_words),
    max_words: toNumber(cfg.max_words),
    number_of_candidates_per_run: toNumber(cfg.number_of_candidates_per_run),
  });

  return {
    version,
    business_id: toStringValue(cfg.business_id),
    business_name: toStringValue(cfg.business_name),
    sender_name: toStringValue(cfg.sender_name),
    sender_email: "",
    collaboration_intent: toStringValue(cfg.collaboration_intent),
    requirements,
    has_distance_requirement: toBoolean(cfg.has_distance_requirement),
    lat: toNumber(cfg.lat),
    lon: toNumber(cfg.lon),
    max_distance_km: toNumber(cfg.max_distance_km),
    fit_score_cutoff: toNumber(cfg.fit_score_cutoff),
    low_conf_cutoff_email_classification:
      toNumber(cfg.low_conf_cutoff_email_classification),
    qualified_conf_email_classification:
      toNumber(cfg.qualified_conf_email_classification),
    search_keyword: toStringValue(cfg.search_keyword),
    search_location: toStringValue(cfg.search_location),
    contact_titles,
    contact_categories: toStringArray(cfg.contact_categories),
    min_words: runSettings.min_words,
    max_words: runSettings.max_words,
    number_of_candidates_per_run: runSettings.number_of_candidates_per_run,
  };
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

export async function saveBusinessConfig(
  body: BusinessConfigSavePayload
): Promise<BusinessConfigState> {
  const response = await authenticatedFetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string" ? error.error : "Failed to save configuration"
    );
  }

  const data = (await response.json()) as BusinessConfigResponse;
  return mapBusinessConfigResponse(data);
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
      typeof data.error === "string"
        ? data.error
        : "Rephrase failed. Please try again later or contact your technical team."
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

export function buildBusinessConfigSavePayload(
  draft: BusinessConfigState
): BusinessConfigSavePayload {
  return {
    business_name: draft.business_name.trim(),
    sender_name: draft.sender_name.trim(),
    collaboration_intent: draft.collaboration_intent.trim(),
    requirements: normalizeRequirements(draft.requirements),
    has_distance_requirement: draft.has_distance_requirement,
    lat: draft.lat,
    lon: draft.lon,
    max_distance_km: draft.max_distance_km,
    fit_score_cutoff: draft.fit_score_cutoff as number,
    low_conf_cutoff_email_classification:
      draft.low_conf_cutoff_email_classification as number,
    qualified_conf_email_classification:
      draft.qualified_conf_email_classification as number,
    search_keyword: draft.search_keyword.trim(),
    search_location: draft.search_location.trim(),
    contact_titles: draft.contact_titles.map((title) => title.trim()).filter(Boolean),
    contact_categories: normalizeContactCategories(draft.contact_categories),
    min_words: draft.min_words as number,
    max_words: draft.max_words as number,
  };
}

function snapshotSavableConfig(draft: BusinessConfigState): string {
  return JSON.stringify({
    business_name: draft.business_name.trim(),
    sender_name: draft.sender_name.trim(),
    collaboration_intent: draft.collaboration_intent.trim(),
    requirements: normalizeRequirements(draft.requirements),
    has_distance_requirement: draft.has_distance_requirement ?? null,
    lat: draft.lat,
    lon: draft.lon,
    max_distance_km: draft.max_distance_km,
    fit_score_cutoff: draft.fit_score_cutoff,
    low_conf_cutoff_email_classification:
      draft.low_conf_cutoff_email_classification,
    qualified_conf_email_classification:
      draft.qualified_conf_email_classification,
    search_keyword: draft.search_keyword.trim(),
    search_location: draft.search_location.trim(),
    contact_titles: draft.contact_titles.map((title) => title.trim()).filter(Boolean),
    contact_categories: normalizeContactCategories(draft.contact_categories),
    min_words: draft.min_words,
    max_words: draft.max_words,
  });
}

export function isBusinessConfigDraftDirty(
  draft: BusinessConfigState,
  baseline: BusinessConfigState
): boolean {
  return snapshotSavableConfig(draft) !== snapshotSavableConfig(baseline);
}

export async function updateCandidatesPerRun(
  number_of_candidates_per_run: number
): Promise<number> {
  const response = await authenticatedFetch(
    ENDPOINTS.BUSINESS_CONFIG_CANDIDATES_PER_RUN,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number_of_candidates_per_run }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to update candidates per run"
    );
  }

  const data = (await response.json()) as {
    number_of_candidates_per_run?: number | null;
  };
  const value = toNumber(data.number_of_candidates_per_run);
  if (value === null || value < 1) {
    throw new Error("Invalid candidates per run response from server");
  }
  return value;
}
