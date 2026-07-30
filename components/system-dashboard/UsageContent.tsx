"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronRight, Coins, Search } from "lucide-react";
import {
  fetchBusinessLevelUsage,
  fetchCandidateLevelLeads,
  fetchCandidateLevelStages,
  fetchCandidateLevelSummary,
  fetchCandidateStageDetail,
  type BusinessLevelUsage,
  type CandidateConfigStages,
  type CandidateLeadUsage,
  type CandidateLevelSummary,
  type CandidateStageDetail,
} from "@/lib/api/usage-client";
import {
  formatConfigLabel,
  formatEstimatedCost,
  formatUsageLabel,
} from "@/lib/constants/usage";
import { DataTableSection, MetricCard } from "./MetricCard";
import { SystemDashboardBackLink } from "./SystemDashboardShared";
import { Pagination } from "@/components/ui/Pagination";

type UsageTab = "business" | "candidate";

const LEADS_PAGE_SIZE = 25;

function ConfigSelect({
  value,
  onChange,
  configs,
  includeAll = true,
}: {
  value: string;
  onChange: (value: string) => void;
  configs: Array<{ config_id: string; version: number }>;
  includeAll?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-gray-700">Config</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
      >
        {includeAll ? <option value="">All configs</option> : null}
        {configs.map((config) => (
          <option key={config.config_id} value={config.config_id}>
            {formatConfigLabel(config.config_id, config.version)}
          </option>
        ))}
      </select>
    </label>
  );
}

function UsageTable({
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
      <div className="px-6 py-10 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                  column.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50/80">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-6 py-3 text-sm text-gray-700 ${
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

function BusinessUsagePanel() {
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [data, setData] = useState<BusinessLevelUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchBusinessLevelUsage(
          selectedConfigId || undefined
        );
        if (cancelled) return;
        setData(result);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load business usage"
        );
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedConfigId]);

  const subtitle = selectedConfigId
    ? "Estimated cost for the selected config"
    : "Estimated cost across all configs for this business";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <MetricCard
          label="Total estimated cost"
          value={loading ? "…" : formatEstimatedCost(data?.total_cost ?? 0)}
          subtext={
            loading
              ? "Loading usage…"
              : `${data?.call_count ?? 0} API calls tracked`
          }
          icon={Coins}
          iconClassName="text-emerald-600"
          iconBoxClassName="bg-emerald-100"
          large
        />
        <div className="flex items-end">
          <ConfigSelect
            value={selectedConfigId}
            onChange={setSelectedConfigId}
            configs={data?.configs ?? []}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <DataTableSection
        title="Cost by task and model"
        subtitle={subtitle}
        hint="From business_level_usage"
      >
        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Loading breakdown…
          </div>
        ) : (
          <UsageTable
            emptyMessage="No business-level usage recorded yet."
            columns={[
              { key: "task", label: "Task" },
              { key: "model", label: "Model" },
              { key: "calls", label: "Calls", align: "right" },
              { key: "cost", label: "Cost", align: "right" },
            ]}
            rows={(data?.by_task_model ?? []).map((row) => ({
              task: formatUsageLabel(row.task),
              model: row.model,
              calls: row.call_count,
              cost: formatEstimatedCost(row.total_cost),
            }))}
          />
        )}
      </DataTableSection>
    </div>
  );
}

function StageBreakdownTable({
  configId,
  stages,
}: {
  configId: string;
  stages: CandidateConfigStages["stages"];
}) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [stageDetails, setStageDetails] = useState<
    Record<string, CandidateStageDetail>
  >({});
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const toggleStage = useCallback(
    async (stage: string) => {
      if (expandedStage === stage) {
        setExpandedStage(null);
        return;
      }

      setExpandedStage(stage);
      if (stageDetails[stage]) return;

      setLoadingStage(stage);
      setStageError(null);

      try {
        const detail = await fetchCandidateStageDetail(configId, stage);
        setStageDetails((current) => ({ ...current, [stage]: detail }));
      } catch (error) {
        setStageError(
          error instanceof Error ? error.message : "Failed to load stage detail"
        );
      } finally {
        setLoadingStage(null);
      }
    },
    [configId, expandedStage, stageDetails]
  );

  if (stages.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-500">
        No candidate-level usage recorded for this config.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stage
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Candidates
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Calls
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cost
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {stages.map((stage) => {
            const isExpanded = expandedStage === stage.stage;
            const detail = stageDetails[stage.stage];

            return (
              <FragmentRow key={stage.stage}>
                <tr
                  className="cursor-pointer hover:bg-gray-50/80"
                  onClick={() => toggleStage(stage.stage)}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      {formatUsageLabel(stage.stage)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700">
                    {stage.candidate_count}
                  </td>
                  <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700">
                    {stage.call_count}
                  </td>
                  <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-900">
                    {formatEstimatedCost(stage.total_cost)}
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="bg-gray-50/60">
                    <td colSpan={4} className="px-6 py-4">
                      {loadingStage === stage.stage ? (
                        <p className="text-sm text-gray-500">
                          Loading task breakdown…
                        </p>
                      ) : stageError ? (
                        <p className="text-sm text-red-600">{stageError}</p>
                      ) : (
                        <UsageTable
                          emptyMessage="No task usage for this stage."
                          columns={[
                            { key: "task", label: "Task" },
                            { key: "calls", label: "Calls", align: "right" },
                            { key: "cost", label: "Cost", align: "right" },
                          ]}
                          rows={(detail?.tasks ?? []).map((task) => ({
                            task: formatUsageLabel(task.task),
                            calls: task.call_count,
                            cost: formatEstimatedCost(task.total_cost),
                          }))}
                        />
                      )}
                    </td>
                  </tr>
                ) : null}
              </FragmentRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function LeadBreakdownTable({
  leads,
  loading,
  total,
  page,
  onPageChange,
  search,
  onSearchChange,
}: {
  leads: CandidateLeadUsage[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));

  return (
    <DataTableSection
      title="Candidates by place ID"
      subtitle="Total cost per lead with stage and task breakdown"
      hint="From candidate_level_usage"
    >
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search company or place ID…"
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-10 text-center text-sm text-gray-500">
          Loading candidates…
        </div>
      ) : leads.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-500">
          No candidate usage found for this config.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Lead
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Calls
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {leads.map((lead) => {
                const isExpanded = expandedLeadId === lead.place_id;

                return (
                  <FragmentRow key={lead.place_id}>
                    <tr
                      className="cursor-pointer hover:bg-gray-50/80"
                      onClick={() =>
                        setExpandedLeadId((current) =>
                          current === lead.place_id ? null : lead.place_id
                        )
                      }
                    >
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-start gap-2">
                          {isExpanded ? (
                            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          )}
                          <span>
                            <span className="font-medium">
                              {lead.company_name || "Unknown company"}
                            </span>
                            <span className="mt-0.5 block font-mono text-xs text-gray-500">
                              {lead.place_id}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700">
                        {lead.call_count}
                      </td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums font-medium text-gray-900">
                        {formatEstimatedCost(lead.total_cost)}
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="bg-gray-50/60">
                        <td colSpan={3} className="px-6 py-4">
                          <div className="space-y-4">
                            {lead.stages.map((stage) => (
                              <div
                                key={`${lead.place_id}-${stage.stage}`}
                                className="rounded-lg border border-gray-200 bg-white"
                              >
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatUsageLabel(stage.stage)}
                                  </p>
                                  <p className="text-sm tabular-nums text-gray-700">
                                    {formatEstimatedCost(stage.total_cost)}
                                  </p>
                                </div>
                                <UsageTable
                                  emptyMessage="No tasks recorded."
                                  columns={[
                                    { key: "task", label: "Task" },
                                    {
                                      key: "calls",
                                      label: "Calls",
                                      align: "right",
                                    },
                                    {
                                      key: "cost",
                                      label: "Cost",
                                      align: "right",
                                    },
                                  ]}
                                  rows={stage.tasks.map((task) => ({
                                    task: formatUsageLabel(task.task),
                                    calls: task.call_count,
                                    cost: formatEstimatedCost(task.total_cost),
                                  }))}
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={LEADS_PAGE_SIZE}
          onPageChange={onPageChange}
          loading={loading}
        />
      ) : null}
    </DataTableSection>
  );
}

function CandidateUsagePanel() {
  const [summary, setSummary] = useState<CandidateLevelSummary | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [stageData, setStageData] = useState<CandidateConfigStages | null>(null);
  const [leads, setLeads] = useState<CandidateLeadUsage[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [search, setSearch] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setSummaryLoading(true);
      setError(null);

      try {
        const result = await fetchCandidateLevelSummary();
        if (cancelled) return;
        setSummary(result);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load candidate usage"
        );
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLeadsPage(1);
  }, [selectedConfigId, search]);

  useEffect(() => {
    if (!selectedConfigId) {
      setStageData(null);
      setLeads([]);
      setLeadsTotal(0);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setDetailLoading(true);
      setError(null);

      try {
        const result = await fetchCandidateLevelStages(selectedConfigId);
        if (cancelled) return;
        setStageData(result);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load config usage"
        );
        setStageData(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedConfigId]);

  useEffect(() => {
    if (!selectedConfigId) {
      setLeads([]);
      setLeadsTotal(0);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLeadsLoading(true);

      try {
        const result = await fetchCandidateLevelLeads({
          configId: selectedConfigId,
          page: leadsPage,
          limit: LEADS_PAGE_SIZE,
          search: search.trim() || undefined,
        });
        if (cancelled) return;
        setLeads(result.leads);
        setLeadsTotal(result.total);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load candidate list"
        );
        setLeads([]);
        setLeadsTotal(0);
      } finally {
        if (!cancelled) setLeadsLoading(false);
      }
    };

    const timer = setTimeout(load, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedConfigId, leadsPage, search]);

  const configOptions = useMemo(
    () => summary?.configs ?? [],
    [summary?.configs]
  );

  const selectedConfigSummary = configOptions.find(
    (config) => config.config_id === selectedConfigId
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <MetricCard
          label={
            selectedConfigId
              ? "Config estimated cost"
              : "Cross-config estimated cost"
          }
          value={
            summaryLoading || detailLoading
              ? "…"
              : formatEstimatedCost(
                  selectedConfigId
                    ? (stageData?.total_cost ??
                        selectedConfigSummary?.total_cost ??
                        0)
                    : (summary?.total_cost ?? 0)
                )
          }
          subtext={
            summaryLoading
              ? "Loading usage…"
              : selectedConfigId
                ? `${stageData?.candidate_count ?? selectedConfigSummary?.candidate_count ?? 0} candidates · ${stageData?.call_count ?? selectedConfigSummary?.call_count ?? 0} calls`
                : `${summary?.candidate_count ?? 0} candidates · ${summary?.call_count ?? 0} calls across all configs`
          }
          icon={Coins}
          iconClassName="text-sky-600"
          iconBoxClassName="bg-sky-100"
          large
        />
        <div className="flex items-end">
          <ConfigSelect
            value={selectedConfigId}
            onChange={setSelectedConfigId}
            configs={configOptions}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!selectedConfigId ? (
        <DataTableSection
          title="Cost by config"
          subtitle="Candidate-level usage grouped by config version"
          hint="From candidate_level_usage"
        >
          {summaryLoading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Loading configs…
            </div>
          ) : (
            <UsageTable
              emptyMessage="No candidate-level usage recorded yet."
              columns={[
                { key: "config", label: "Config" },
                { key: "candidates", label: "Candidates", align: "right" },
                { key: "calls", label: "Calls", align: "right" },
                { key: "cost", label: "Cost", align: "right" },
              ]}
              rows={configOptions.map((config) => ({
                config: formatConfigLabel(config.config_id, config.version),
                candidates: config.candidate_count ?? 0,
                calls: config.call_count,
                cost: formatEstimatedCost(config.total_cost),
              }))}
            />
          )}
        </DataTableSection>
      ) : (
        <>
          <DataTableSection
            title="Cost by stage"
            subtitle={`Stage breakdown for ${formatConfigLabel(
              selectedConfigId,
              stageData?.version ?? selectedConfigSummary?.version ?? 0
            )}`}
            hint="Expand a stage to see task-level cost"
          >
            {detailLoading ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                Loading stage breakdown…
              </div>
            ) : (
              <StageBreakdownTable
                configId={selectedConfigId}
                stages={stageData?.stages ?? []}
              />
            )}
          </DataTableSection>

          <LeadBreakdownTable
            leads={leads}
            loading={leadsLoading}
            total={leadsTotal}
            page={leadsPage}
            onPageChange={setLeadsPage}
            search={search}
            onSearchChange={setSearch}
          />
        </>
      )}
    </div>
  );
}

export function UsageContent() {
  const [activeTab, setActiveTab] = useState<UsageTab>("business");

  return (
    <div className="px-8 py-8">
      <SystemDashboardBackLink
        title="Usage"
        subtitle="Estimated LLM cost from business-level and candidate-level usage tables"
      />

      <div className="mb-6 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "business"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Business level
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("candidate")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "candidate"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Candidate level
        </button>
      </div>

      {activeTab === "business" ? (
        <BusinessUsagePanel />
      ) : (
        <CandidateUsagePanel />
      )}
    </div>
  );
}
