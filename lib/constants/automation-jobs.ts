export const DAILY_PROSPECT_LIMIT = 200;
export const MAX_RUNNING_AUTOMATION_JOBS = 2;

export const DISCOVERY_QUOTA_EXCEEDED_MESSAGE =
  "Daily prospect quota exceeded. Please try again tomorrow.";

export const DISCOVERY_RUNNING_QUEUE_FULL_MESSAGE =
  "2/2 jobs are running. The task queue is full — wait for a job to finish before trying again.";

export const DISCOVERY_SAME_VERSION_RUNNING_MESSAGE =
  "This configuration is already running. Wait for the current run to finish, or switch configuration.";

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
