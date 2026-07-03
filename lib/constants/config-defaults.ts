export const DEFAULT_CONTACT_TITLES = [
  "Director of Sales",
  "Sales Manager",
  "General Manager",
  "Director of Marketing",
  "Marketing Manager",
] as const;

export const DEFAULT_RUN_SETTINGS = {
  min_words: 90,
  max_words: 160,
  number_of_candidates_per_run: 50,
} as const;

export function resolveContactTitles(saved: string[]): string[] {
  if (saved.length === 0) {
    return [...DEFAULT_CONTACT_TITLES];
  }

  return saved;
}

export function resolveRunSettings(settings: {
  min_words: number | null;
  max_words: number | null;
  number_of_candidates_per_run: number | null;
}) {
  return {
    min_words: settings.min_words ?? DEFAULT_RUN_SETTINGS.min_words,
    max_words: settings.max_words ?? DEFAULT_RUN_SETTINGS.max_words,
    number_of_candidates_per_run:
      settings.number_of_candidates_per_run ??
      DEFAULT_RUN_SETTINGS.number_of_candidates_per_run,
  };
}

export function formatDefaultContactTitlesHelp(): string {
  return `Default titles:\n${DEFAULT_CONTACT_TITLES.join("\n")}`;
}

export function formatDefaultRunSettingsHelp(): string {
  const defaults = DEFAULT_RUN_SETTINGS;
  return [
    "Default values:",
    `Min. words per email: ${defaults.min_words}`,
    `Max. words per email: ${defaults.max_words}`,
    `Candidates per run: ${defaults.number_of_candidates_per_run}`,
  ].join("\n");
}
