import { DEFAULT_BUSINESS_ID } from "@/lib/types/business-config";

const base = `/api/business/${DEFAULT_BUSINESS_ID}/config`;

async function patchConfig<T>(path: string, body: T) {
  const response = await fetch(`${base}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to save configuration");
  }

  return response.json();
}

export async function fetchBusinessConfig() {
  const response = await fetch(base);
  if (!response.ok) return null;
  return response.json();
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
