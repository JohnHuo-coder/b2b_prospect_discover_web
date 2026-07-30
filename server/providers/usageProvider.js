import { pool } from '../../lib/db/client.ts';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

async function listBusinessConfigs(business_id, client = pool) {
  const result = await client.query(
    `SELECT bc.id AS config_id,
            bc.version,
            COALESCE(SUM(blu.estimated_cost), 0) AS total_cost,
            COUNT(blu.id)::int AS call_count
     FROM prospect_discover.business_configs bc
     LEFT JOIN prospect_discover.business_level_usage blu
       ON blu.config_id = bc.id
     WHERE bc.business_id = $1
     GROUP BY bc.id, bc.version
     ORDER BY bc.version DESC`,
    [business_id]
  );

  return result.rows.map((row) => ({
    config_id: String(row.config_id),
    version: Number(row.version),
    total_cost: toNumber(row.total_cost),
    call_count: Number(row.call_count) || 0,
  }));
}

export async function getBusinessLevelUsage({ business_id, config_id = null }) {
  if (config_id != null) {
    const config = await assertConfigBelongsToBusiness(config_id, business_id);
    if (!config) {
      return { error: 'Config not found for this business' };
    }
  }

  const params = [business_id];
  let configFilter = '';
  if (config_id != null) {
    params.push(config_id);
    configFilter = 'AND blu.config_id = $2';
  }

  const [totalResult, breakdownResult, configs] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(blu.estimated_cost), 0) AS total_cost,
              COUNT(blu.id)::int AS call_count
       FROM prospect_discover.business_level_usage blu
       JOIN prospect_discover.business_configs bc ON bc.id = blu.config_id
       WHERE bc.business_id = $1
       ${configFilter}`,
      params
    ),
    pool.query(
      `SELECT blu.task,
              blu.model,
              COALESCE(SUM(blu.estimated_cost), 0) AS total_cost,
              COUNT(blu.id)::int AS call_count
       FROM prospect_discover.business_level_usage blu
       JOIN prospect_discover.business_configs bc ON bc.id = blu.config_id
       WHERE bc.business_id = $1
       ${configFilter}
       GROUP BY blu.task, blu.model
       ORDER BY total_cost DESC, blu.task ASC, blu.model ASC`,
      params
    ),
    listBusinessConfigs(business_id),
  ]);

  return {
    total_cost: toNumber(totalResult.rows[0]?.total_cost),
    call_count: Number(totalResult.rows[0]?.call_count) || 0,
    selected_config_id: config_id != null ? String(config_id) : null,
    configs,
    by_task_model: breakdownResult.rows.map((row) => ({
      task: row.task,
      model: row.model,
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
    })),
  };
}

export async function getCandidateLevelSummary({ business_id }) {
  const [totalResult, configRows] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(clu.estimated_cost), 0) AS total_cost,
              COUNT(clu.id)::int AS call_count,
              COUNT(DISTINCT clu.place_id)::int AS candidate_count
       FROM prospect_discover.candidate_level_usage clu
       JOIN prospect_discover.business_configs bc ON bc.id = clu.config_id
       WHERE bc.business_id = $1`,
      [business_id]
    ),
    pool.query(
      `SELECT clu.config_id,
              bc.version,
              COALESCE(SUM(clu.estimated_cost), 0) AS total_cost,
              COUNT(clu.id)::int AS call_count,
              COUNT(DISTINCT clu.place_id)::int AS candidate_count
       FROM prospect_discover.candidate_level_usage clu
       JOIN prospect_discover.business_configs bc ON bc.id = clu.config_id
       WHERE bc.business_id = $1
       GROUP BY clu.config_id, bc.version
       ORDER BY bc.version DESC`,
      [business_id]
    ),
  ]);

  return {
    total_cost: toNumber(totalResult.rows[0]?.total_cost),
    call_count: Number(totalResult.rows[0]?.call_count) || 0,
    candidate_count: Number(totalResult.rows[0]?.candidate_count) || 0,
    configs: configRows.rows.map((row) => ({
      config_id: String(row.config_id),
      version: Number(row.version),
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
      candidate_count: Number(row.candidate_count) || 0,
    })),
  };
}

export async function getCandidateLevelStages({ business_id, config_id }) {
  const config = await assertConfigBelongsToBusiness(config_id, business_id);
  if (!config) {
    return { error: 'Config not found for this business' };
  }

  const [totalResult, stageRows] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(estimated_cost), 0) AS total_cost,
              COUNT(id)::int AS call_count,
              COUNT(DISTINCT place_id)::int AS candidate_count
       FROM prospect_discover.candidate_level_usage
       WHERE config_id = $1`,
      [config_id]
    ),
    pool.query(
      `SELECT stage,
              COALESCE(SUM(estimated_cost), 0) AS total_cost,
              COUNT(id)::int AS call_count,
              COUNT(DISTINCT place_id)::int AS candidate_count
       FROM prospect_discover.candidate_level_usage
       WHERE config_id = $1
       GROUP BY stage
       ORDER BY total_cost DESC, stage ASC`,
      [config_id]
    ),
  ]);

  return {
    config_id: String(config_id),
    version: Number(config.version),
    total_cost: toNumber(totalResult.rows[0]?.total_cost),
    call_count: Number(totalResult.rows[0]?.call_count) || 0,
    candidate_count: Number(totalResult.rows[0]?.candidate_count) || 0,
    stages: stageRows.rows.map((row) => ({
      stage: row.stage,
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
      candidate_count: Number(row.candidate_count) || 0,
    })),
  };
}

export async function getCandidateLevelStageDetail({
  business_id,
  config_id,
  stage,
}) {
  const config = await assertConfigBelongsToBusiness(config_id, business_id);
  if (!config) {
    return { error: 'Config not found for this business' };
  }

  const result = await pool.query(
    `SELECT task,
            COALESCE(SUM(estimated_cost), 0) AS total_cost,
            COUNT(id)::int AS call_count
     FROM prospect_discover.candidate_level_usage
     WHERE config_id = $1
       AND stage = $2
     GROUP BY task
     ORDER BY total_cost DESC, task ASC`,
    [config_id, stage]
  );

  const totalResult = await pool.query(
    `SELECT COALESCE(SUM(estimated_cost), 0) AS total_cost,
            COUNT(id)::int AS call_count
     FROM prospect_discover.candidate_level_usage
     WHERE config_id = $1
       AND stage = $2`,
    [config_id, stage]
  );

  return {
    config_id: String(config_id),
    stage,
    total_cost: toNumber(totalResult.rows[0]?.total_cost),
    call_count: Number(totalResult.rows[0]?.call_count) || 0,
    tasks: result.rows.map((row) => ({
      task: row.task,
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
    })),
  };
}

export async function getCandidateLevelLeads({
  business_id,
  config_id,
  page = 1,
  limit = 25,
  search,
}) {
  const config = await assertConfigBelongsToBusiness(config_id, business_id);
  if (!config) {
    return { error: 'Config not found for this business' };
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
  const offset = (safePage - 1) * safeLimit;
  const searchTerm = search?.trim() || null;

  const listParams = [config_id, safeLimit, offset];
  let searchFilter = '';
  if (searchTerm) {
    listParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    searchFilter = `AND (ic.company_name ILIKE $4 OR clu.place_id ILIKE $5)`;
  }

  const countParams = [config_id];
  let countSearchFilter = '';
  if (searchTerm) {
    countParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    countSearchFilter = `AND (ic.company_name ILIKE $2 OR clu.place_id ILIKE $3)`;
  }

  const [countResult, leadRows, stageRows, taskRows] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM (
         SELECT clu.place_id
         FROM prospect_discover.candidate_level_usage clu
         LEFT JOIN prospect_discover.initial_candidates ic
           ON ic.config_id = clu.config_id
          AND ic.place_id = clu.place_id
         WHERE clu.config_id = $1
         ${countSearchFilter}
         GROUP BY clu.place_id, ic.company_name
       ) grouped`,
      countParams
    ),
    pool.query(
      `SELECT clu.place_id,
              MAX(ic.company_name) AS company_name,
              COALESCE(SUM(clu.estimated_cost), 0) AS total_cost,
              COUNT(clu.id)::int AS call_count
       FROM prospect_discover.candidate_level_usage clu
       LEFT JOIN prospect_discover.initial_candidates ic
         ON ic.config_id = clu.config_id
        AND ic.place_id = clu.place_id
       WHERE clu.config_id = $1
       ${searchFilter}
       GROUP BY clu.place_id
       ORDER BY total_cost DESC, company_name ASC NULLS LAST, clu.place_id ASC
       LIMIT $2 OFFSET $3`,
      listParams
    ),
    pool.query(
      `SELECT place_id,
              stage,
              COALESCE(SUM(estimated_cost), 0) AS total_cost,
              COUNT(id)::int AS call_count
       FROM prospect_discover.candidate_level_usage
       WHERE config_id = $1
       GROUP BY place_id, stage
       ORDER BY place_id ASC, total_cost DESC, stage ASC`,
      [config_id]
    ),
    pool.query(
      `SELECT place_id,
              stage,
              task,
              COALESCE(SUM(estimated_cost), 0) AS total_cost,
              COUNT(id)::int AS call_count
       FROM prospect_discover.candidate_level_usage
       WHERE config_id = $1
       GROUP BY place_id, stage, task
       ORDER BY place_id ASC, stage ASC, total_cost DESC, task ASC`,
      [config_id]
    ),
  ]);

  const stageMap = new Map();
  for (const row of stageRows.rows) {
    const key = row.place_id;
    if (!stageMap.has(key)) stageMap.set(key, []);
    stageMap.get(key).push({
      stage: row.stage,
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
    });
  }

  const taskMap = new Map();
  for (const row of taskRows.rows) {
    const key = `${row.place_id}::${row.stage}`;
    if (!taskMap.has(key)) taskMap.set(key, []);
    taskMap.get(key).push({
      task: row.task,
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
    });
  }

  const leads = leadRows.rows.map((row) => {
    const stages = (stageMap.get(row.place_id) ?? []).map((stageRow) => ({
      ...stageRow,
      tasks: taskMap.get(`${row.place_id}::${stageRow.stage}`) ?? [],
    }));

    return {
      place_id: row.place_id,
      company_name: row.company_name ?? null,
      total_cost: toNumber(row.total_cost),
      call_count: Number(row.call_count) || 0,
      stages,
    };
  });

  return {
    config_id: String(config_id),
    version: Number(config.version),
    leads,
    total: Number(countResult.rows[0]?.total) || 0,
    page: safePage,
    limit: safeLimit,
  };
}

const usageProvider = {
  getBusinessLevelUsage,
  getCandidateLevelSummary,
  getCandidateLevelStages,
  getCandidateLevelStageDetail,
  getCandidateLevelLeads,
};

export default usageProvider;
