import type { BusinessConfigState } from "@/lib/types/business-config";

const SCORING_THRESHOLD_MIN = 0;
const SCORING_THRESHOLD_MAX = 100;

export type ConfigReadinessIssue = {
  section: string;
  message: string;
};

function isValidScoringThreshold(value: number | null): value is number {
  return (
    value !== null &&
    value >= SCORING_THRESHOLD_MIN &&
    value <= SCORING_THRESHOLD_MAX
  );
}

export function validateBusinessConfigForRun(
  config: BusinessConfigState
): { ready: boolean; issues: ConfigReadinessIssue[] } {
  const issues: ConfigReadinessIssue[] = [];

  if (config.version < 1) {
    issues.push({
      section: "Configuration",
      message: "Complete business configuration before starting a run",
    });
  }

  if (!config.business_name.trim()) {
    issues.push({
      section: "Business Identity",
      message: "Business name is required",
    });
  }

  if (!config.collaboration_intent.trim()) {
    issues.push({
      section: "Business Identity",
      message: "Collaboration intent is required",
    });
  }

  if (config.requirements.length === 0) {
    issues.push({
      section: "Requirements",
      message: "At least one requirement is required",
    });
  }

  if (!isValidScoringThreshold(config.fit_score_cutoff)) {
    issues.push({
      section: "Scoring Thresholds",
      message: "Fit score cutoff is required (0–100)",
    });
  }

  if (!isValidScoringThreshold(config.low_conf_cutoff_email_classification)) {
    issues.push({
      section: "Scoring Thresholds",
      message: "Low confidence cutoff is required (0–100)",
    });
  }

  if (!isValidScoringThreshold(config.qualified_conf_email_classification)) {
    issues.push({
      section: "Scoring Thresholds",
      message: "Qualified confidence cutoff is required (0–100)",
    });
  }

  if (!config.search_keyword.trim()) {
    issues.push({
      section: "Target Partner",
      message: "Search keyword is required",
    });
  }

  if (!config.search_location.trim()) {
    issues.push({
      section: "Target Partner",
      message: "Search location is required",
    });
  }

  if (config.contact_titles.length === 0) {
    issues.push({
      section: "Contact Preferences",
      message: "At least one contact title is required",
    });
  }

  if (config.min_words === null || config.min_words < 1) {
    issues.push({
      section: "Outreach Settings",
      message: "Min. words per email is required",
    });
  }

  if (config.max_words === null || config.max_words < 1) {
    issues.push({
      section: "Outreach Settings",
      message: "Max. words per email is required",
    });
  }

  if (
    config.min_words !== null &&
    config.max_words !== null &&
    config.min_words >= config.max_words
  ) {
    issues.push({
      section: "Outreach Settings",
      message: "Max words must be greater than min words",
    });
  }

  if (
    config.number_of_candidates_per_run === null ||
    config.number_of_candidates_per_run < 1
  ) {
    issues.push({
      section: "Run Settings",
      message: "Candidates per run is required",
    });
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}
