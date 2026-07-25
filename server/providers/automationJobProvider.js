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
  START_DISCOVERY_ORPHAN_JOB_GRACE_MS,
} from '../../lib/constants/automation-jobs.ts';

async function queryProspectNumberForRun(client, business_id, version) {
  const { rows } = await client.query(
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

async function queryDiscoveryJobStats(client, business_id, version) {
  const [usageResult, runningResult] = await Promise.all([
    client.query(
      `SELECT COALESCE(SUM(prospect_number), 0)::int AS used_today
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1
         AND created_at >= CURRENT_DATE
         AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
      [business_id]
    ),
    client.query(
      `SELECT
         COUNT(*) FILTER (WHERE LOWER(status) = 'running')::int AS running_count,
         COUNT(*) FILTER (
           WHERE LOWER(status) = 'running' AND version = $2
         )::int AS running_same_version
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1`,
      [business_id, version]
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
    runningSameVersion:
      Number(runningResult.rows[0]?.running_same_version) || 0,
  };
}

function evaluateDiscoveryStart(stats, prospectNumber) {
  if (stats.runningSameVersion >= 1) {
    return {
      allowed: false,
      message: DISCOVERY_SAME_VERSION_RUNNING_MESSAGE,
    };
  }

  if (stats.runningJobs.count >= MAX_RUNNING_AUTOMATION_JOBS) {
    return {
      allowed: false,
      message: DISCOVERY_RUNNING_QUEUE_FULL_MESSAGE,
    };
  }

  if (stats.prospectUsage.used + prospectNumber > DAILY_PROSPECT_LIMIT) {
    return {
      allowed: false,
      message: DISCOVERY_QUOTA_EXCEEDED_MESSAGE,
    };
  }

  return { allowed: true };
}

async function failOrphanedRunningJobs(client, business_id) {
  const graceMinutes = Math.max(1, Math.ceil(START_DISCOVERY_ORPHAN_JOB_GRACE_MS / 60_000));

  await client.query(
    `UPDATE prospect_discover.automation_jobs
     SET status = 'failed'
     WHERE business_id = $1
       AND LOWER(status) = 'running'
       AND prospect_number IS NULL
       AND created_at < NOW() - ($2 * INTERVAL '1 minute')`,
    [business_id, graceMinutes]
  );
}

async function getProspectNumberForRun(business_id, version) {
  return queryProspectNumberForRun(pool, business_id, version);
}

export async function getBusinessDiscoveryQuota(business_id) {
  const stats = await queryDiscoveryJobStats(pool, business_id, null);
  return {
    prospectUsage: stats.prospectUsage,
    runningJobs: stats.runningJobs,
  };
}

export async function getDiscoveryJobStats(business_id, version) {
  const stats = await queryDiscoveryJobStats(pool, business_id, version);
  return {
    prospectUsage: stats.prospectUsage,
    runningJobs: stats.runningJobs,
    runningSameVersion: stats.runningSameVersion,
  };
}

export async function validateStartDiscovery({ business_id, version }) {
  const prospectNumber = await getProspectNumberForRun(business_id, version);
  if (prospectNumber === null) {
    throw new Error('Configuration required before starting discovery');
  }

  const stats = await getDiscoveryJobStats(business_id, version);
  const decision = evaluateDiscoveryStart(stats, prospectNumber);

  if (!decision.allowed) {
    return {
      allowed: false,
      message: decision.message,
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

/**
 * Atomically validates quota/queue limits and inserts a running automation job.
 * Serializes concurrent starts for the same business via businesses row lock.
 */
export async function reserveRunningAutomationJob({ business_id, version }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: businessRows } = await client.query(
      `SELECT id
       FROM prospect_discover.businesses
       WHERE id = $1
       FOR UPDATE`,
      [business_id]
    );

    if (businessRows.length === 0) {
      throw new Error('Business not found');
    }

    await failOrphanedRunningJobs(client, business_id);

    const prospectNumber = await queryProspectNumberForRun(
      client,
      business_id,
      version
    );
    if (prospectNumber === null) {
      await client.query('ROLLBACK');
      throw new Error('Configuration required before starting discovery');
    }

    const stats = await queryDiscoveryJobStats(client, business_id, version);
    const decision = evaluateDiscoveryStart(stats, prospectNumber);

    if (!decision.allowed) {
      await client.query('ROLLBACK');
      return {
        allowed: false,
        message: decision.message,
        prospectUsage: stats.prospectUsage,
        runningJobs: stats.runningJobs,
        automationJobId: null,
      };
    }

    const { rows: insertRows } = await client.query(
      `INSERT INTO prospect_discover.automation_jobs (business_id, version, status)
       VALUES ($1, $2, 'running')
       RETURNING id`,
      [business_id, version]
    );

    await client.query('COMMIT');

    const statsAfterInsert = await getDiscoveryJobStats(business_id, version);

    return {
      allowed: true,
      message: null,
      automationJobId: insertRows[0]?.id ?? null,
      prospectUsage: statsAfterInsert.prospectUsage,
      runningJobs: statsAfterInsert.runningJobs,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** @deprecated Use reserveRunningAutomationJob for concurrent-safe starts. */
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
  reserveRunningAutomationJob,
  createRunningAutomationJob,
  updateAutomationJobStatus,
};
