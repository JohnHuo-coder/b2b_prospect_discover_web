"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type DefaultEdgeOptions,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  fetchInfoAcquisitionSummary,
  fetchInfoAcquisitionWorkflowByReq,
} from "@/lib/api/system-dashboard-client";
import {
  applyStageCountsToNodes,
  mapWorkflowStageCounts,
  pipelineInitialEdges,
  pipelineInitialNodes,
  type PipelineNodeData,
} from "@/lib/system-dashboard/information-acquisition-pipeline-flow";
import { PipelineFlowNode, PipelineGroupNode } from "./PipelineFlowNode";
import "./workflow-canvas.css";

const nodeTypes: NodeTypes = {
  pipeline: PipelineFlowNode,
  pipelineGroup: PipelineGroupNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "default",
  style: {
    stroke: "#94a3b8",
    strokeWidth: 1.5,
    strokeDasharray: "8 6",
  },
  className: "workflow-flow-edge",
  labelStyle: {
    fill: "#e2e8f0",
    fontSize: 10,
    fontWeight: 500,
  },
  labelBgStyle: {
    fill: "#1e293b",
    fillOpacity: 0.92,
  },
};

function onFlowInit(instance: ReactFlowInstance) {
  void instance.fitView({
    padding: 0.12,
    maxZoom: 1.15,
    minZoom: 0.85,
    duration: 200,
  });
}

export function InformationAcquisitionPipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequirementParam = searchParams.get("requirement_index");
  const initialRequirementIndex = initialRequirementParam
    ? Number(initialRequirementParam)
    : null;
  const [nodes, setNodes, onNodesChange] = useNodesState(pipelineInitialNodes);
  const [edges, , onEdgesChange] = useEdgesState(pipelineInitialEdges);
  const [requirements, setRequirements] = useState<
    Array<{ requirement_index: number; requirement_text: string }>
  >([]);
  const [requirementIndex, setRequirementIndex] = useState<number | null>(
    null
  );
  const [loadingRequirements, setLoadingRequirements] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRequirements() {
      setLoadingRequirements(true);
      setError(null);

      try {
        const result = await fetchInfoAcquisitionSummary();
        if (cancelled) return;

        setRequirements(result.requirements);
        setRequirementIndex((current) => {
          if (
            current != null &&
            result.requirements.some((row) => row.requirement_index === current)
          ) {
            return current;
          }
          if (
            initialRequirementIndex != null &&
            Number.isFinite(initialRequirementIndex) &&
            result.requirements.some(
              (row) => row.requirement_index === initialRequirementIndex
            )
          ) {
            return initialRequirementIndex;
          }
          return result.requirements[0]?.requirement_index ?? null;
        });
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load requirements"
        );
        setRequirements([]);
        setRequirementIndex(null);
      } finally {
        if (!cancelled) setLoadingRequirements(false);
      }
    }

    void loadRequirements();

    return () => {
      cancelled = true;
    };
  }, [initialRequirementIndex]);

  useEffect(() => {
    if (requirementIndex == null) return;

    router.replace(
      `/system-dashboard/information-acquisition/pipeline?requirement_index=${requirementIndex}`,
      { scroll: false }
    );
  }, [requirementIndex, router]);

  useEffect(() => {
    if (requirementIndex == null) {
      setNodes(
        applyStageCountsToNodes(
          pipelineInitialNodes,
          mapWorkflowStageCounts([])
        )
      );
      return;
    }

    let cancelled = false;

    async function loadWorkflowCounts() {
      setLoadingCounts(true);
      setError(null);

      try {
        const result = await fetchInfoAcquisitionWorkflowByReq(requirementIndex);
        if (cancelled) return;

        const stageCounts = mapWorkflowStageCounts(result.stages);
        setNodes(applyStageCountsToNodes(pipelineInitialNodes, stageCounts));
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load stage counts"
        );
        setNodes(
          applyStageCountsToNodes(
            pipelineInitialNodes,
            mapWorkflowStageCounts([])
          )
        );
      } finally {
        if (!cancelled) setLoadingCounts(false);
      }
    }

    void loadWorkflowCounts();

    return () => {
      cancelled = true;
    };
  }, [requirementIndex, setNodes]);

  const selectedRequirement = useMemo(
    () =>
      requirements.find((row) => row.requirement_index === requirementIndex) ??
      null,
    [requirements, requirementIndex]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type !== "pipeline" || requirementIndex == null) return;
      router.push(
        `/system-dashboard/information-acquisition/pipeline/${node.id}?requirement_index=${requirementIndex}`
      );
    },
    [router, requirementIndex]
  );

  return (
    <div className="workflow-canvas flex h-[calc(100vh-3rem)] flex-col bg-zinc-100 px-6 py-6 text-zinc-950">
      <div className="mb-4 shrink-0">
        <Link
          href="/system-dashboard/information-acquisition"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Information Acquisition
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Information Acquisition Pipeline
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Numbers show failed candidates per stage for the selected requirement.
          Click a step for details. Hover for stage name.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {loadingRequirements ? (
            <span className="text-sm text-zinc-500">Loading requirements...</span>
          ) : requirements.length === 0 ? (
            <span className="text-sm text-zinc-500">No requirements found.</span>
          ) : (
            requirements.map((row) => {
              const active = requirementIndex === row.requirement_index;

              return (
                <button
                  key={row.requirement_index}
                  type="button"
                  onClick={() => setRequirementIndex(row.requirement_index)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-violet-600 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Requirement {row.requirement_index}
                </button>
              );
            })
          )}
          {loadingCounts ? (
            <span className="text-xs text-zinc-500">Updating counts...</span>
          ) : null}
        </div>

        {selectedRequirement?.requirement_text ? (
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            {selectedRequirement.requirement_text}
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-700/40 shadow-sm">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onInit={onFlowInit}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          minZoom={0.35}
          maxZoom={2}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#475569"
          />
          <MiniMap
            nodeColor={(node) => {
              const kind = (node.data as PipelineNodeData).kind;
              if (kind === "group") return "#64748b";
              if (kind === "end") return "#34d399";
              return "#e2e8f0";
            }}
            maskColor="rgb(15 23 42 / 0.55)"
            className="!border-slate-600 !bg-slate-800"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
