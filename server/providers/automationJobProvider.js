import { pool } from '../../lib/db/client.ts';
import {
  clampCandidatesPerRun,
  isValidCandidatesPerRun,
} from '../../lib/constants/candidates-per-run.ts';
import {
  DAILY_PROSPECT_LIMIT,
  DISCOVERY_GLOBAL_QUEUE_FULL_MESSAGE,
  DISCOVERY_GLOBAL_QUEUE_BACKLOG_MESSAGE,
  DISCOVERY_QUOTA_EXCEEDED_MESSAGE,
  DISCOVERY_RUNNING_QUEUE_FULL_MESSAGE,
  DISCOVERY_SAME_VERSION_RUNNING_MESSAGE,
  DISCOVERY_SAME_VERSION_QUEUED_MESSAGE,
  GLOBAL_DISCOVERY_ADVISORY_LOCK_ID,
  MAX_GLOBAL_RUNNING_AUTOMATION_JOBS,
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

async function queryGlobalRunningJobCount(client) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS global_running_count
     FROM prospect_discover.automation_jobs
     WHERE LOWER(status) = 'running'`
  );

  return Number(rows[0]?.global_running_count) || 0;
}

async function queryGlobalQueuedJobCount(client) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS global_queued_count
     FROM prospect_discover.automation_jobs
     WHERE LOWER(status) = 'queued'`
  );

  return Number(rows[0]?.global_queued_count) || 0;
}

function shouldQueueDiscoveryStart(globalRunningCount, globalQueuedCount) {
  return (
    globalRunningCount >= MAX_GLOBAL_RUNNING_AUTOMATION_JOBS ||
    globalQueuedCount > 0
  );
}

function resolveDiscoveryQueueMessage(globalRunningCount, globalQueuedCount) {
  if (globalRunningCount >= MAX_GLOBAL_RUNNING_AUTOMATION_JOBS) {
    return DISCOVERY_GLOBAL_QUEUE_FULL_MESSAGE;
  }

  return DISCOVERY_GLOBAL_QUEUE_BACKLOG_MESSAGE;
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
         )::int AS running_same_version,
         COUNT(*) FILTER (
           WHERE LOWER(status) = 'queued' AND version = $2
         )::int AS queued_same_version
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
    queuedSameVersion:
      Number(runningResult.rows[0]?.queued_same_version) || 0,
  };
}

function evaluateDiscoveryStart(stats, prospectNumber) {
  if (stats.runningSameVersion >= 1) {
    return {
      allowed: false,
      message: DISCOVERY_SAME_VERSION_RUNNING_MESSAGE,
    };
  }

  if (stats.queuedSameVersion >= 1) {
    return {
      allowed: false,
      message: DISCOVERY_SAME_VERSION_QUEUED_MESSAGE,
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
    queuedSameVersion: stats.queuedSameVersion,
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

    // lock_timeout: if another transaction holds FOR UPDATE on businesses (same company),
    // give up after 5s instead of waiting until Vercel maxDuration (504).
    await client.query(`SET LOCAL lock_timeout = '5s'`);

    // statement_timeout: cap any single SQL in this transaction (safety net for slow queries).
    await client.query(`SET LOCAL statement_timeout = '15s'`);

    // Row lock serializes concurrent "Start Discovery" for the same company.
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
        globalRunningJobs: null,
        automationJobId: null,
        queued: false,
      };
    }

    await client.query(`SELECT pg_advisory_xact_lock($1)`, [
      GLOBAL_DISCOVERY_ADVISORY_LOCK_ID,
    ]);

    const globalRunningCount = await queryGlobalRunningJobCount(client);
    const globalQueuedCount = await queryGlobalQueuedJobCount(client);
    const globalRunningJobs = {
      count: globalRunningCount,
      limit: MAX_GLOBAL_RUNNING_AUTOMATION_JOBS,
    };
    const queueJob = shouldQueueDiscoveryStart(
      globalRunningCount,
      globalQueuedCount
    );
    const nextStatus = queueJob ? 'queued' : 'running';

    const { rows: insertRows } = await client.query(
      `INSERT INTO prospect_discover.automation_jobs (business_id, version, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [business_id, version, nextStatus]
    );

    await client.query('COMMIT');

    const statsAfterInsert = await getDiscoveryJobStats(business_id, version);

    return {
      allowed: true,
      queued: queueJob,
      message: queueJob
        ? resolveDiscoveryQueueMessage(globalRunningCount, globalQueuedCount)
        : null,
      automationJobId: insertRows[0]?.id ?? null,
      prospectUsage: statsAfterInsert.prospectUsage,
      runningJobs: statsAfterInsert.runningJobs,
      globalRunningJobs,
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

export async function listAutomationJobsForBusiness(
  business_id,
  { page = 1, limit = 25 } = {}
) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
  const offset = (safePage - 1) * safeLimit;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, created_at, version, status, prospect_number, reason
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [business_id, safeLimit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM prospect_discover.automation_jobs
       WHERE business_id = $1`,
      [business_id]
    ),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.total) || 0,
    page: safePage,
    limit: safeLimit,
  };
}

export default {
  getBusinessDiscoveryQuota,
  getDiscoveryJobStats,
  validateStartDiscovery,
  reserveRunningAutomationJob,
  createRunningAutomationJob,
  updateAutomationJobStatus,
  listAutomationJobsForBusiness,
};
