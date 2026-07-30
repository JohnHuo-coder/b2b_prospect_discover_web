"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
  API_ERROR_SOLVED_FILTER_OPTIONS,
  fetchApiErrorApiSummary,
  fetchApiErrorConfigs,
  fetchApiErrorExecutions,
  fetchApiErrorWorkflowSummary,
  formatApiErrorTimestamp,
  type ApiErrorApi,
  type ApiErrorApiSummary,
  type ApiErrorConfig,
  type ApiErrorExecutionsResponse,
  type ApiErrorSolvedFilter,
  type ApiErrorWorkflow,
  type ApiErrorWorkflowSummary,
} from "@/lib/api/api-error-client";
import { formatConfigLabel } from "@/lib/constants/usage";
import { DataTableSection, MetricCard } from "./MetricCard";
import { SystemDashboardBackLink } from "./SystemDashboardShared";
import { Modal } from "@/components/ui/Modal";
import { SimpleSelect } from "@/components/ui/SimpleSelect";

function UnsolvedCount({ value }: { value: number }) {
  return (
    <span
      className={
        value > 0
          ? "font-semibold tabular-nums text-red-600"
          : "tabular-nums text-zinc-500"
      }
    >
      {value}
    </span>
  );
}

function SolvedStatusTag({ solved }: { solved: boolean }) {
  if (solved) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        Solved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
      Unsolved
    </span>
  );
}

function DetailTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: Array<{ key: string; label: string; align?: "right" }>;
  rows: Array<Record<string, ReactNode>>;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="px-2 py-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-100">
        <thead className="bg-zinc-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 ${
                  column.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-zinc-50/80">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-sm text-zinc-700 ${
                    column.align === "right" ? "text-right tabular-nums" : ""
                  }`}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiErrorsContent() {
  const [configs, setConfigs] = useState<ApiErrorConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [solvedFilter, setSolvedFilter] = useState<ApiErrorSolvedFilter>("all");
  const [summary, setSummary] = useState<ApiErrorWorkflowSummary | null>(null);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedWorkflow, setSelectedWorkflow] =
    useState<ApiErrorWorkflow | null>(null);
  const [apiSummary, setApiSummary] = useState<ApiErrorApiSummary | null>(null);
  const [apisLoading, setApisLoading] = useState(false);
  const [apisError, setApisError] = useState<string | null>(null);

  const [selectedApi, setSelectedApi] = useState<ApiErrorApi | null>(null);
  const [executionsData, setExecutionsData] =
    useState<ApiErrorExecutionsResponse | null>(null);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [executionsError, setExecutionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setConfigsLoading(true);
      setError(null);

      try {
        const result = await fetchApiErrorConfigs();
        if (cancelled) return;
        setConfigs(result.configs);
        setSelectedConfigId(result.current_config_id ?? "");
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load configs"
        );
      } finally {
        if (!cancelled) setConfigsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedConfigId) {
      setSummary(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setSummaryLoading(true);
      setError(null);

      try {
        const result = await fetchApiErrorWorkflowSummary(
          selectedConfigId,
          solvedFilter
        );
        if (cancelled) return;
        setSummary(result);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load API errors"
        );
        setSummary(null);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedConfigId, solvedFilter]);

  const loadApiSummary = useCallback(
    async (workflow: ApiErrorWorkflow) => {
      if (!selectedConfigId) return;

      setApisLoading(true);
      setApisError(null);

      try {
        const result = await fetchApiErrorApiSummary(
          selectedConfigId,
          workflow.workflow_name,
          solvedFilter
        );
        setApiSummary(result);
      } catch (loadError) {
        setApisError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load API breakdown"
        );
        setApiSummary(null);
      } finally {
        setApisLoading(false);
      }
    },
    [selectedConfigId, solvedFilter]
  );

  const loadExecutions = useCallback(
    async (api: ApiErrorApi) => {
      if (!selectedConfigId || !selectedWorkflow) return;

      setExecutionsLoading(true);
      setExecutionsError(null);

      try {
        const result = await fetchApiErrorExecutions(
          selectedConfigId,
          selectedWorkflow.workflow_name,
          api.api_name,
          solvedFilter
        );
        setExecutionsData(result);
      } catch (loadError) {
        setExecutionsError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load execution IDs"
        );
        setExecutionsData(null);
      } finally {
        setExecutionsLoading(false);
      }
    },
    [selectedConfigId, selectedWorkflow, solvedFilter]
  );

  useEffect(() => {
    if (!selectedWorkflow) return;
    loadApiSummary(selectedWorkflow);
  }, [selectedWorkflow, loadApiSummary]);

  useEffect(() => {
    if (!selectedApi) return;
    loadExecutions(selectedApi);
  }, [selectedApi, loadExecutions]);

  const closeWorkflowModal = useCallback(() => {
    setSelectedWorkflow(null);
    setApiSummary(null);
    setApisError(null);
    setApisLoading(false);
  }, []);

  const closeExecutionsModal = useCallback(() => {
    setSelectedApi(null);
    setExecutionsData(null);
    setExecutionsError(null);
    setExecutionsLoading(false);
  }, []);

  const openWorkflowModal = useCallback((workflow: ApiErrorWorkflow) => {
    setSelectedWorkflow(workflow);
    setApiSummary(null);
    setApisError(null);
  }, []);

  const openExecutionsModal = useCallback((api: ApiErrorApi) => {
    setSelectedApi(api);
    setExecutionsData(null);
    setExecutionsError(null);
  }, []);

  const configOptions = configs.map((config) => ({
    value: config.config_id,
    label: formatConfigLabel(config.config_id, config.version),
  }));

  const selectedConfig = configs.find(
    (config) => config.config_id === selectedConfigId
  );

  const emptyWorkflowMessage =
    solvedFilter === "unsolved"
      ? "No unsolved API errors for this config."
      : solvedFilter === "solved"
        ? "No solved API errors for this config."
        : "No API errors recorded for this config.";

  return (
    <div className="px-8 py-8">
      <SystemDashboardBackLink
        title="API Errors"
        subtitle="External API failures grouped by workflow, API, and execution ID"
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px_200px]">
          <MetricCard
            label="Total errors"
            value={
              configsLoading || summaryLoading
                ? "…"
                : String(summary?.total_errors ?? 0)
            }
            subtext={
              selectedConfig
                ? `All records on ${formatConfigLabel(selectedConfig.config_id, selectedConfig.version)}`
                : "Select a config"
            }
            icon={AlertTriangle}
            iconClassName="text-zinc-600"
            iconBoxClassName="bg-zinc-100"
            large
          />
          <MetricCard
            label="Unsolved"
            value={
              configsLoading || summaryLoading
                ? "…"
                : String(summary?.unsolved_errors ?? 0)
            }
            subtext="solved = false"
            icon={AlertTriangle}
            iconClassName="text-red-600"
            iconBoxClassName="bg-red-100"
            large
            valueClassName={
              (summary?.unsolved_errors ?? 0) > 0
                ? "text-red-700"
                : "text-zinc-950"
            }
          />
          <div className="flex items-end">
            {configsLoading ? (
              <p className="pb-2 text-sm text-zinc-500">Loading configs…</p>
            ) : configOptions.length === 0 ? (
              <p className="pb-2 text-sm text-zinc-500">No configs found</p>
            ) : (
              <SimpleSelect
                label="Config"
                value={selectedConfigId}
                onChange={setSelectedConfigId}
                options={configOptions}
                placeholder="Select config"
                className="w-full min-w-[160px]"
              />
            )}
          </div>
          <div className="flex items-end">
            <SimpleSelect
              label="Status filter"
              value={solvedFilter}
              onChange={(value) =>
                setSolvedFilter(value as ApiErrorSolvedFilter)
              }
              options={API_ERROR_SOLVED_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              className="w-full min-w-[160px]"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <DataTableSection
          title="Errors by workflow"
          subtitle={
            selectedConfig
              ? `Grouped by workflow_name for ${formatConfigLabel(selectedConfig.config_id, selectedConfig.version)}`
              : "Select a config to view workflow errors"
          }
          hint="From api_error"
        >
          {configsLoading || summaryLoading ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-500">
              Loading workflow errors…
            </div>
          ) : !selectedConfigId ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-500">
              No config selected.
            </div>
          ) : (
            <DetailTable
              emptyMessage={emptyWorkflowMessage}
              columns={[
                { key: "workflow", label: "Workflow" },
                { key: "errors", label: "Total", align: "right" },
                { key: "unsolved", label: "Unsolved", align: "right" },
                { key: "actions", label: "Details", align: "right" },
              ]}
              rows={(summary?.workflows ?? []).map((workflow) => ({
                workflow: (
                  <span className="font-medium text-zinc-950">
                    {workflow.workflow_name}
                  </span>
                ),
                errors: workflow.error_count,
                unsolved: <UnsolvedCount value={workflow.unsolved_count} />,
                actions: (
                  <button
                    type="button"
                    onClick={() => openWorkflowModal(workflow)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
                  >
                    View APIs
                  </button>
                ),
              }))}
            />
          )}
        </DataTableSection>
      </div>

      <Modal
        open={selectedWorkflow != null}
        title={selectedWorkflow?.workflow_name ?? "Workflow errors"}
        onClose={closeWorkflowModal}
        size="lg"
      >
        {selectedWorkflow ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Total errors
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
                  {apiSummary?.total_errors ?? selectedWorkflow.error_count}
                </p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                  Unsolved
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-red-700">
                  {apiSummary?.unsolved_errors ??
                    selectedWorkflow.unsolved_count}
                </p>
              </div>
            </div>

            {apisLoading ? (
              <p className="text-sm text-zinc-500">Loading API breakdown…</p>
            ) : apisError ? (
              <p className="text-sm text-red-600">{apisError}</p>
            ) : (
              <DetailTable
                emptyMessage="No API errors for this workflow."
                columns={[
                  { key: "api", label: "API name" },
                  { key: "errors", label: "Total", align: "right" },
                  { key: "unsolved", label: "Unsolved", align: "right" },
                  { key: "actions", label: "Executions", align: "right" },
                ]}
                rows={(apiSummary?.apis ?? []).map((api) => ({
                  api: (
                    <span className="font-medium text-zinc-950">
                      {api.api_name}
                    </span>
                  ),
                  errors: api.error_count,
                  unsolved: <UnsolvedCount value={api.unsolved_count} />,
                  actions: (
                    <button
                      type="button"
                      onClick={() => openExecutionsModal(api)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
                    >
                      View executions
                    </button>
                  ),
                }))}
              />
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedApi != null}
        title={selectedApi?.api_name ?? "Execution IDs"}
        onClose={closeExecutionsModal}
        size="xl"
      >
        {selectedApi && selectedWorkflow ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              <p>
                <span className="font-medium text-zinc-700">Workflow:</span>{" "}
                {selectedWorkflow.workflow_name}
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <p>
                  <span className="font-medium text-zinc-700">Total:</span>{" "}
                  {selectedApi.error_count}
                </p>
                <p>
                  <span className="font-medium text-red-700">Unsolved:</span>{" "}
                  <span className="font-semibold text-red-600">
                    {selectedApi.unsolved_count}
                  </span>
                </p>
              </div>
            </div>

            {executionsLoading ? (
              <p className="text-sm text-zinc-500">Loading execution IDs…</p>
            ) : executionsError ? (
              <p className="text-sm text-red-600">{executionsError}</p>
            ) : (
              <DetailTable
                emptyMessage="No execution IDs recorded."
                columns={[
                  { key: "execution_id", label: "Execution ID" },
                  { key: "status", label: "Status" },
                  { key: "errors", label: "Total", align: "right" },
                  { key: "last_seen", label: "Last seen", align: "right" },
                ]}
                rows={(executionsData?.executions ?? []).map((execution) => ({
                  execution_id: (
                    <span className="font-mono text-sm text-zinc-950">
                      {execution.execution_id}
                    </span>
                  ),
                  status: <SolvedStatusTag solved={execution.solved} />,
                  errors: execution.error_count,
                  last_seen: formatApiErrorTimestamp(execution.last_seen_at),
                }))}
              />
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
