import { pool } from '../../lib/db/client.ts';
import {
  clampCandidatesPerRun,
  isValidCandidatesPerRun,
} from '../../lib/constants/candidates-per-run.ts';
import {
  DAILY_PROSPECT_LIMIT,
  DISCOVERY_QUOTA_EXCEEDED_MESSAGE,
  DISCOVERY_RUNNING_QUEUE_FULL_MESSAGE,
  DISCOVERY_SAME_VERSION_RUNNING_MESSAGE,
  MAX_RUNNING_AUTOMATION_JOBS,
} from '../../lib/constants/automation-jobs.ts';

async function getProspectNumberForRun(business_id, version) {
  const { rows } = await pool.query(
    `SELECT number_of_candidates_per_run
     FROM prospect_discover.business_configs
     WHERE business_id = $1
       AND version = $2`,
    [business_id, version]
  );

  if (rows.length === 0) {
    return null;
  }

  const value = Number(rows[0].number_of_candidates_per_run);
  if (!isValidCandidatesPerRun(value)) {
    return null;
  }

  return clampCandidatesPerRun(value);
}

export async function getBusinessDiscoveryQuota(business_id) {
  const [usageResult, runningResult] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(prospect_number), 0)::int AS used_today
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1
         AND created_at >= CURRENT_DATE
         AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
      [business_id]
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE LOWER(status) = 'running')::int AS running_count
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1`,
      [business_id]
    ),
  ]);

  return {
    prospectUsage: {
      used: Number(usageResult.rows[0]?.used_today) || 0,
      limit: DAILY_PROSPECT_LIMIT,
    },
    runningJobs: {
      count: Number(runningResult.rows[0]?.running_count) || 0,
      limit: MAX_RUNNING_AUTOMATION_JOBS,
    },
  };
}

export async function getDiscoveryJobStats(business_id, version) {
  const [businessQuota, runningResult] = await Promise.all([
    getBusinessDiscoveryQuota(business_id),
    pool.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE LOWER(status) = 'running' AND version = $2
         )::int AS running_same_version
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1`,
      [business_id, version]
    ),
  ]);

  return {
    ...businessQuota,
    runningSameVersion:
      Number(runningResult.rows[0]?.running_same_version) || 0,
  };
}

export async function validateStartDiscovery({ business_id, version }) {
  const prospectNumber = await getProspectNumberForRun(business_id, version);
  if (prospectNumber === null) {
    throw new Error('Configuration required before starting discovery');
  }

  const stats = await getDiscoveryJobStats(business_id, version);

  if (stats.runningSameVersion >= 1) {
    return {
      allowed: false,
      message: DISCOVERY_SAME_VERSION_RUNNING_MESSAGE,
      prospectUsage: stats.prospectUsage,
      runningJobs: stats.runningJobs,
    };
  }

  if (stats.runningJobs.count >= MAX_RUNNING_AUTOMATION_JOBS) {
    return {
      allowed: false,
      message: DISCOVERY_RUNNING_QUEUE_FULL_MESSAGE,
      prospectUsage: stats.prospectUsage,
      runningJobs: stats.runningJobs,
    };
  }

  if (stats.prospectUsage.used + prospectNumber > DAILY_PROSPECT_LIMIT) {
    return {
      allowed: false,
      message: DISCOVERY_QUOTA_EXCEEDED_MESSAGE,
      prospectUsage: stats.prospectUsage,
      runningJobs: stats.runningJobs,
    };
  }

  return {
    allowed: true,
    prospectNumber,
    prospectUsage: stats.prospectUsage,
    runningJobs: stats.runningJobs,
  };
}

export async function createRunningAutomationJob({ business_id, version }) {
  const { rows } = await pool.query(
    `INSERT INTO prospect_discover.automation_jobs (business_id, version, status)
     VALUES ($1, $2, 'running')
     RETURNING id`,
    [business_id, version]
  );

  return rows[0]?.id ?? null;
}

export async function updateAutomationJobStatus(jobId, status) {
  if (!jobId) return;

  await pool.query(
    `UPDATE prospect_discover.automation_jobs
     SET status = $2
     WHERE id = $1`,
    [jobId, status]
  );
}

export default {
  getBusinessDiscoveryQuota,
  getDiscoveryJobStats,
  validateStartDiscovery,
  createRunningAutomationJob,
  updateAutomationJobStatus,
};
