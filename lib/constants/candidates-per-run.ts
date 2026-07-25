export const MIN_CANDIDATES_PER_RUN = 1;
export const MAX_CANDIDATES_PER_RUN = 100;

export const CANDIDATES_PER_RUN_RANGE_ERROR = `Candidates per run must be between ${MIN_CANDIDATES_PER_RUN} and ${MAX_CANDIDATES_PER_RUN}`;

export function isValidCandidatesPerRun(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_CANDIDATES_PER_RUN &&
    value <= MAX_CANDIDATES_PER_RUN
  );
}

export function clampCandidatesPerRun(value: number): number {
  return Math.min(
    Math.max(value, MIN_CANDIDATES_PER_RUN),
    MAX_CANDIDATES_PER_RUN
  );
}
