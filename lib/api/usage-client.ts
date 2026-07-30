import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type UsageConfigSummary = {
  config_id: string;
  version: number;
  total_cost: number;
  call_count: number;
  candidate_count?: number;
};

export type UsageTaskModelRow = {
  task: string;
  model: string;
  total_cost: number;
  call_count: number;
};

export type BusinessLevelUsage = {
  total_cost: number;
  call_count: number;
  selected_config_id: string | null;
  configs: UsageConfigSummary[];
  by_task_model: UsageTaskModelRow[];
};

export type CandidateLevelSummary = {
  total_cost: number;
  call_count: number;
  candidate_count: number;
  configs: UsageConfigSummary[];
};

export type CandidateStageUsage = {
  stage: string;
  total_cost: number;
  call_count: number;
  candidate_count: number;
};

export type CandidateConfigStages = {
  config_id: string;
  version: number;
  total_cost: number;
  call_count: number;
  candidate_count: number;
  stages: CandidateStageUsage[];
};

export type CandidateStageTaskUsage = {
  task: string;
  total_cost: number;
  call_count: number;
};

export type CandidateStageDetail = {
  config_id: string;
  stage: string;
  total_cost: number;
  call_count: number;
  tasks: CandidateStageTaskUsage[];
};

export type CandidateLeadTaskUsage = CandidateStageTaskUsage;

export type CandidateLeadStageUsage = {
  stage: string;
  total_cost: number;
  call_count: number;
  tasks: CandidateLeadTaskUsage[];
};

export type CandidateLeadUsage = {
  place_id: string;
  company_name: string | null;
  total_cost: number;
  call_count: number;
  stages: CandidateLeadStageUsage[];
};

export type CandidateLeadsUsage = {
  config_id: string;
  version: number;
  leads: CandidateLeadUsage[];
  total: number;
  page: number;
  limit: number;
};

async function readUsageResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load usage data"
    );
  }
  return data as T;
}

export async function fetchBusinessLevelUsage(configId?: string) {
  const params = new URLSearchParams();
  if (configId) {
    params.set("config_id", configId);
  }

  const url = params.toString()
    ? `${ENDPOINTS.SYSTEM_DASHBOARD_USAGE_BUSINESS}?${params}`
    : ENDPOINTS.SYSTEM_DASHBOARD_USAGE_BUSINESS;

  const response = await authenticatedFetch(url);
  return readUsageResponse<BusinessLevelUsage>(response);
}

export async function fetchCandidateLevelSummary() {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_USAGE_CANDIDATE_SUMMARY
  );
  return readUsageResponse<CandidateLevelSummary>(response);
}

export async function fetchCandidateLevelStages(configId: string) {
  const params = new URLSearchParams({ config_id: configId });
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_USAGE_CANDIDATE_STAGES}?${params}`
  );
  return readUsageResponse<CandidateConfigStages>(response);
}

export async function fetchCandidateStageDetail(
  configId: string,
  stage: string
) {
  const params = new URLSearchParams({ config_id: configId, stage });
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_USAGE_CANDIDATE_STAGE_DETAIL}?${params}`
  );
  return readUsageResponse<CandidateStageDetail>(response);
}

export async function fetchCandidateLevelLeads(options: {
  configId: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const params = new URLSearchParams({ config_id: options.configId });
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.search?.trim()) params.set("search", options.search.trim());

  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_USAGE_CANDIDATE_LEADS}?${params}`
  );
  return readUsageResponse<CandidateLeadsUsage>(response);
}
