import { pool } from '../../lib/db/client.ts';

const SOLVED_FILTERS = new Set(['all', 'solved', 'unsolved']);

export function parseSolvedFilter(raw) {
  const value = String(raw ?? 'all')
    .trim()
    .toLowerCase();
  return SOLVED_FILTERS.has(value) ? value : 'all';
}

function groupHavingClause(solved_filter) {
  if (solved_filter === 'unsolved') {
    return 'HAVING COUNT(*) FILTER (WHERE COALESCE(solved, false) = false) > 0';
  }
  if (solved_filter === 'solved') {
    return 'HAVING COUNT(*) FILTER (WHERE COALESCE(solved, false) = false) = 0 AND COUNT(*) > 0';
  }
  return 'HAVING COUNT(*) > 0';
}

function executionHavingClause(solved_filter) {
  if (solved_filter === 'unsolved') {
    return 'HAVING BOOL_OR(COALESCE(solved, false) = false)';
  }
  if (solved_filter === 'solved') {
    return 'HAVING COUNT(*) FILTER (WHERE COALESCE(solved, false) = false) = 0 AND COUNT(*) > 0';
  }
  return '';
}

async function assertConfigBelongsToBusiness(config_id, business_id, client = pool) {
  const result = await client.query(
    `SELECT id, version
     FROM prospect_discover.business_configs
     WHERE id = $1 AND business_id = $2`,
    [config_id, business_id]
  );

  return result.rows[0] ?? null;
}

export async function listApiErrorConfigs({ business_id, current_version = 0 }) {
  const result = await pool.query(
    `SELECT id AS config_id, version
     FROM prospect_discover.business_configs
     WHERE business_id = $1
     ORDER BY version DESC`,
    [business_id]
  );

  const configs = result.rows.map((row) => ({
    config_id: String(row.config_id),
    version: Number(row.version),
  }));

  const currentConfig =
    configs.find((config) => config.version === Number(current_version)) ??
    configs[0] ??
    null;

  return {
    configs,
    current_config_id: currentConfig?.config_id ?? null,
    current_version: currentConfig?.version ?? null,
  };
}

export async function getApiErrorWorkflowSummary({
  business_id,
  config_id,
  solved_filter = 'all',
}) {
  const config = await assertConfigBelongsToBusiness(config_id, business_id);
  if (!config) {
    return { error: 'Config not found for this business' };
  }

  const filter = parseSolvedFilter(solved_filter);
  const havingClause = groupHavingClause(filter);

  const [totalResult, workflowRows] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total_errors,
              COUNT(*) FILTER (WHERE COALESCE(solved, false) = false)::int AS unsolved_errors
       FROM prospect_discover.api_error
       WHERE config_id = $1`,
      [config_id]
    ),
    pool.query(
      `SELECT workflow_name,
              COUNT(*)::int AS error_count,
              COUNT(*) FILTER (WHERE COALESCE(solved, false) = false)::int AS unsolved_count
       FROM prospect_discover.api_error
       WHERE config_id = $1
       GROUP BY workflow_name
       ${havingClause}
       ORDER BY unsolved_count DESC, error_count DESC, workflow_name ASC`,
      [config_id]
    ),
  ]);

  return {
    config_id: String(config_id),
    version: Number(config.version),
    solved_filter: filter,
    total_errors: Number(totalResult.rows[0]?.total_errors) || 0,
    unsolved_errors: Number(totalResult.rows[0]?.unsolved_errors) || 0,
    workflows: workflowRows.rows.map((row) => ({
      workflow_name: row.workflow_name,
      error_count: Number(row.error_count) || 0,
      unsolved_count: Number(row.unsolved_count) || 0,
    })),
  };
}

export async function getApiErrorApiSummary({
  business_id,
  config_id,
  workflow_name,
  solved_filter = 'all',
}) {
  const config = await assertConfigBelongsToBusiness(config_id, business_id);
  if (!config) {
    return { error: 'Config not found for this business' };
  }

  const filter = parseSolvedFilter(solved_filter);
  const havingClause = groupHavingClause(filter);

  const [totalResult, apiRows] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total_errors,
              COUNT(*) FILTER (WHERE COALESCE(solved, false) = false)::int AS unsolved_errors
       FROM prospect_discover.api_error
       WHERE config_id = $1
         AND workflow_name = $2`,
      [config_id, workflow_name]
    ),
    pool.query(
      `SELECT api_name,
              COUNT(*)::int AS error_count,
              COUNT(*) FILTER (WHERE COALESCE(solved, false) = false)::int AS unsolved_count
       FROM prospect_discover.api_error
       WHERE config_id = $1
         AND workflow_name = $2
       GROUP BY api_name
       ${havingClause}
       ORDER BY unsolved_count DESC, error_count DESC, api_name ASC`,
      [config_id, workflow_name]
    ),
  ]);

  return {
    config_id: String(config_id),
    workflow_name,
    solved_filter: filter,
    total_errors: Number(totalResult.rows[0]?.total_errors) || 0,
    unsolved_errors: Number(totalResult.rows[0]?.unsolved_errors) || 0,
    apis: apiRows.rows.map((row) => ({
      api_name: row.api_name,
      error_count: Number(row.error_count) || 0,
      unsolved_count: Number(row.unsolved_count) || 0,
    })),
  };
}

export async function getApiErrorExecutions({
  business_id,
  config_id,
  workflow_name,
  api_name,
  solved_filter = 'all',
}) {
  const config = await assertConfigBelongsToBusiness(config_id, business_id);
  if (!config) {
    return { error: 'Config not found for this business' };
  }

  const filter = parseSolvedFilter(solved_filter);
  const havingClause = executionHavingClause(filter);

  const result = await pool.query(
    `SELECT execution_id,
            MIN(created_at) AS first_seen_at,
            MAX(created_at) AS last_seen_at,
            COUNT(*)::int AS error_count,
            COUNT(*) FILTER (WHERE COALESCE(solved, false) = false)::int AS unsolved_count,
            BOOL_OR(COALESCE(solved, false) = false) AS has_unsolved
     FROM prospect_discover.api_error
     WHERE config_id = $1
       AND workflow_name = $2
       AND api_name = $3
     GROUP BY execution_id
     ${havingClause}
     ORDER BY has_unsolved DESC, last_seen_at DESC, execution_id ASC`,
    [config_id, workflow_name, api_name]
  );

  return {
    config_id: String(config_id),
    workflow_name,
    api_name,
    solved_filter: filter,
    executions: result.rows.map((row) => ({
      execution_id: row.execution_id,
      error_count: Number(row.error_count) || 0,
      unsolved_count: Number(row.unsolved_count) || 0,
      solved: !row.has_unsolved,
      first_seen_at: row.first_seen_at,
      last_seen_at: row.last_seen_at,
    })),
  };
}

const apiErrorProvider = {
  parseSolvedFilter,
  listApiErrorConfigs,
  getApiErrorWorkflowSummary,
  getApiErrorApiSummary,
  getApiErrorExecutions,
};

export default apiErrorProvider;
