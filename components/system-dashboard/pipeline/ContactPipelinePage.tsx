"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { fetchContactWorkflow } from "@/lib/api/system-dashboard-client";
import {
  applyContactStageCountsToNodes,
  contactPipelineInitialEdges,
  contactPipelineInitialNodes,
  mapContactWorkflowStageCounts,
  type ContactNodeData,
} from "@/lib/system-dashboard/contact-pipeline-flow";
import { ContactPipelineFlowNode } from "./ContactPipelineFlowNode";
import "./workflow-canvas.css";

const nodeTypes: NodeTypes = {
  contactPipeline: ContactPipelineFlowNode,
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
    padding: 0.18,
    maxZoom: 1.2,
    minZoom: 0.9,
    duration: 200,
  });
}

export function ContactPipelinePage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(
    contactPipelineInitialNodes
  );
  const [edges, , onEdgesChange] = useEdgesState(contactPipelineInitialEdges);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflowCounts() {
      setLoadingCounts(true);
      setError(null);

      try {
        const result = await fetchContactWorkflow();
        if (cancelled) return;

        const stageCounts = mapContactWorkflowStageCounts(result.stages);
        setNodes(
          applyContactStageCountsToNodes(contactPipelineInitialNodes, stageCounts)
        );
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load stage counts"
        );
        setNodes(
          applyContactStageCountsToNodes(
            contactPipelineInitialNodes,
            mapContactWorkflowStageCounts([])
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
  }, [setNodes]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type !== "contactPipeline") return;
      const data = node.data as ContactNodeData;
      if (data.kind !== "step" || !data.finalStage) return;
      router.push(`/system-dashboard/contact/pipeline/${node.id}`);
    },
    [router]
  );

  return (
    <div className="workflow-canvas flex h-[calc(100vh-3rem)] flex-col bg-zinc-100 px-6 py-6 text-zinc-950">
      <div className="mb-4 shrink-0">
        <Link
          href="/system-dashboard/contact"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Contact
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Contact Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Numbers show failed candidates per stage. Click a step for details.
          Hover for stage name.
        </p>
        {loadingCounts ? (
          <p className="mt-2 text-xs text-zinc-500">Updating counts...</p>
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
              const kind = (node.data as ContactNodeData).kind;
              if (kind === "intro") return "#64748b";
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
