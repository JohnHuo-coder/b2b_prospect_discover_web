export const DEFAULT_FIT_SCORE_CUTOFF = 75;

export const FIT_SCORE_CUTOFF_HELP =
  "Controls how strictly candidates are filtered. A higher cutoff is more demanding and rejects more candidates. A lower cutoff is more lenient and lets more candidates pass.";

export function formatDefaultFitScoreCutoffHelp(): string {
  return `Default value: ${DEFAULT_FIT_SCORE_CUTOFF}`;
}
