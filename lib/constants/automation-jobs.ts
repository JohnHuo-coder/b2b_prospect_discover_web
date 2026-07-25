export const DAILY_PROSPECT_LIMIT = 200;
export const MAX_RUNNING_AUTOMATION_JOBS = 2;

export const DISCOVERY_QUOTA_EXCEEDED_MESSAGE =
  "Daily prospect quota exceeded. Please try again tomorrow.";

export const DISCOVERY_RUNNING_QUEUE_FULL_MESSAGE =
  "2/2 jobs are running. The task queue is full — wait for a job to finish before trying again.";

export const DISCOVERY_SAME_VERSION_RUNNING_MESSAGE =
  "This configuration is already running. Wait for the current run to finish, or switch configuration.";

/** How long the API waits for n8n to acknowledge the start-discovery webhook. */
export const START_DISCOVERY_N8N_TIMEOUT_MS = 25_000;

/** Client-side fetch timeout for start discovery (DB reservation only; n8n runs in background). */
export const START_DISCOVERY_CLIENT_TIMEOUT_MS = 20_000;

/** Running jobs with no progress older than this are treated as orphaned starts. */
export const START_DISCOVERY_ORPHAN_JOB_GRACE_MS = 3 * 60 * 1000;

export const START_DISCOVERY_TIMEOUT_MESSAGE =
  "Starting discovery timed out. The request may not have reached automation — please wait a moment and try again.";

export const START_DISCOVERY_N8N_ERROR_MESSAGE =
  "Failed to reach automation. Please try again later or contact your technical team.";

export type ProspectUsage = {
  used: number;
  limit: number;
};

export type RunningJobsUsage = {
  count: number;
  limit: number;
};

export function formatProspectUsage(usage: ProspectUsage): string {
  return `${usage.used}/${usage.limit}`;
}
