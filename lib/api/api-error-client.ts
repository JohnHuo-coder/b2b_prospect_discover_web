import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type ApiErrorSolvedFilter = "all" | "solved" | "unsolved";

export type ApiErrorConfig = {
  config_id: string;
  version: number;
};

export type ApiErrorConfigsResponse = {
  configs: ApiErrorConfig[];
  current_config_id: string | null;
  current_version: number | null;
};

export type ApiErrorWorkflow = {
  workflow_name: string;
  error_count: number;
  unsolved_count: number;
};

export type ApiErrorWorkflowSummary = {
  config_id: string;
  version: number;
  solved_filter: ApiErrorSolvedFilter;
  total_errors: number;
  unsolved_errors: number;
  workflows: ApiErrorWorkflow[];
};

export type ApiErrorApi = {
  api_name: string;
  error_count: number;
  unsolved_count: number;
};

export type ApiErrorApiSummary = {
  config_id: string;
  workflow_name: string;
  solved_filter: ApiErrorSolvedFilter;
  total_errors: number;
  unsolved_errors: number;
  apis: ApiErrorApi[];
};

export type ApiErrorExecution = {
  execution_id: string;
  error_count: number;
  unsolved_count: number;
  solved: boolean;
  first_seen_at: string;
  last_seen_at: string;
};

export type ApiErrorExecutionsResponse = {
  config_id: string;
  workflow_name: string;
  api_name: string;
  solved_filter: ApiErrorSolvedFilter;
  executions: ApiErrorExecution[];
};

async function readApiErrorResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load API errors"
    );
  }
  return data as T;
}

function appendSolvedFilter(
  params: URLSearchParams,
  solvedFilter?: ApiErrorSolvedFilter
) {
  if (solvedFilter && solvedFilter !== "all") {
    params.set("solved_filter", solvedFilter);
  }
}

export async function fetchApiErrorConfigs() {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_API_ERRORS_CONFIGS
  );
  return readApiErrorResponse<ApiErrorConfigsResponse>(response);
}

export async function fetchApiErrorWorkflowSummary(
  configId: string,
  solvedFilter: ApiErrorSolvedFilter = "all"
) {
  const params = new URLSearchParams({ config_id: configId });
  appendSolvedFilter(params, solvedFilter);
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_API_ERRORS}?${params}`
  );
  return readApiErrorResponse<ApiErrorWorkflowSummary>(response);
}

export async function fetchApiErrorApiSummary(
  configId: string,
  workflowName: string,
  solvedFilter: ApiErrorSolvedFilter = "all"
) {
  const params = new URLSearchParams({
    config_id: configId,
    workflow_name: workflowName,
  });
  appendSolvedFilter(params, solvedFilter);
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_API_ERRORS_APIS}?${params}`
  );
  return readApiErrorResponse<ApiErrorApiSummary>(response);
}

export async function fetchApiErrorExecutions(
  configId: string,
  workflowName: string,
  apiName: string,
  solvedFilter: ApiErrorSolvedFilter = "all"
) {
  const params = new URLSearchParams({
    config_id: configId,
    workflow_name: workflowName,
    api_name: apiName,
  });
  appendSolvedFilter(params, solvedFilter);
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_API_ERRORS_EXECUTIONS}?${params}`
  );
  return readApiErrorResponse<ApiErrorExecutionsResponse>(response);
}

export function formatApiErrorTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export const API_ERROR_SOLVED_FILTER_OPTIONS: Array<{
  value: ApiErrorSolvedFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "unsolved", label: "Unsolved only" },
  { value: "solved", label: "Solved only" },
];
