import { clampCandidatesPerRun } from "@/lib/constants/candidates-per-run";
import {
  normalizeContactCategories,
  type ContactCategory,
} from "@/lib/constants/contact-categories";

export const DEFAULT_CONTACT_TITLES = [
  "Director of Sales",
  "Sales Manager",
  "General Manager",
  "Director of Marketing",
  "Marketing Manager",
] as const;

export const DEFAULT_CONTACT_CATEGORIES = ["sales", "marketing"] as const;

export const DEFAULT_RUN_SETTINGS = {
  min_words: 90,
  max_words: 160,
  number_of_candidates_per_run: 50,
} as const;

export const DEFAULT_SUBJECT_LINE_SUFFIX = " - Partnership Opportunity";

export function buildDefaultSubjectLine(businessName: string): string {
  const trimmed = businessName.trim();
  if (!trimmed) {
    return `Partnership Opportunity`;
  }

  return `${trimmed}${DEFAULT_SUBJECT_LINE_SUFFIX}`;
}

export function resolveSubjectLine(
  subjectLine: string | null | undefined,
  businessName: string
): string {
  const trimmed = typeof subjectLine === "string" ? subjectLine.trim() : "";
  if (trimmed) {
    return trimmed;
  }

  return buildDefaultSubjectLine(businessName);
}

export function resolveContactTitles(saved: string[]): string[] {
  if (saved.length === 0) {
    return [...DEFAULT_CONTACT_TITLES];
  }

  return saved;
}

export function getDefaultContactCategories(): ContactCategory[] {
  return normalizeContactCategories([...DEFAULT_CONTACT_CATEGORIES]);
}

export function resolveContactCategories(saved: string[]): ContactCategory[] {
  const normalized = normalizeContactCategories(saved);
  if (normalized.length === 0) {
    return getDefaultContactCategories();
  }

  return normalized;
}

export function resolveRunSettings(settings: {
  min_words: number | null;
  max_words: number | null;
  number_of_candidates_per_run: number | null;
}) {
  return {
    min_words: settings.min_words ?? DEFAULT_RUN_SETTINGS.min_words,
    max_words: settings.max_words ?? DEFAULT_RUN_SETTINGS.max_words,
    number_of_candidates_per_run: clampCandidatesPerRun(
      settings.number_of_candidates_per_run ??
        DEFAULT_RUN_SETTINGS.number_of_candidates_per_run
    ),
  };
}

export function formatDefaultContactTitlesHelp(): string {
  return `Default titles:\n${DEFAULT_CONTACT_TITLES.join("\n")}`;
}

export function formatDefaultContactCategoriesHelp(): string {
  return `Default categories:\n${getDefaultContactCategories().join("\n")}`;
}

export function formatDefaultRunSettingsHelp(): string {
  const defaults = DEFAULT_RUN_SETTINGS;
  return [
    "Default values:",
    `Subject line: {Business Name}${DEFAULT_SUBJECT_LINE_SUFFIX}`,
    `Min. words per email: ${defaults.min_words}`,
    `Max. words per email: ${defaults.max_words}`,
  ].join("\n");
}
