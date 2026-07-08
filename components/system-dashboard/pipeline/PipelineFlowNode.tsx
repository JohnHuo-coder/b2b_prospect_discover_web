"use client";

import { memo } from "react";
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  FORK_NODE_IDS,
  PIPELINE_ENTRY_NODE_ID,
  type PipelineNodeData,
  type PipelineNodeKind,
} from "@/lib/system-dashboard/information-acquisition-pipeline-flow";
import { cn } from "@/lib/utils";

const handleClassName =
  "!h-2 !w-2 !rounded-full !border !border-slate-400 !bg-slate-100";

function getHandleConfig(id: string, kind: PipelineNodeKind) {
  const isFork = (FORK_NODE_IDS as readonly string[]).includes(id);

  return {
    leftTarget: id !== PIPELINE_ENTRY_NODE_ID,
    rightSource: kind !== "end" && !isFork,
    branchUpSource: isFork,
    branchDownSource: isFork,
    bottomTarget: id === "end_final",
  };
}

function CircularNode({
  label,
  kind,
  count,
}: {
  label: string;
  kind: PipelineNodeKind;
  count: number;
}) {
  return (
    <div className="group relative flex h-full w-full items-center justify-center">
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full border-2 text-xs font-semibold shadow-md transition-shadow group-hover:shadow-lg",
          (kind === "step" || kind === "end") && "cursor-pointer",
          kind === "step" && "border-slate-200 bg-white text-slate-800",
          kind === "end" && "border-emerald-400 bg-emerald-400 text-emerald-950"
        )}
      >
        {count}
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 max-w-[220px] -translate-x-1/2 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-center text-[10px] font-medium leading-snug text-slate-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

function PipelineFlowNodeComponent({
  data,
  id,
}: NodeProps<Node<PipelineNodeData>>) {
  const handles = getHandleConfig(id, data.kind);

  return (
    <div className="relative h-full w-full">
      <CircularNode label={data.label} kind={data.kind} count={data.count} />

      {handles.leftTarget ? (
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className={handleClassName}
        />
      ) : null}

      {handles.rightSource ? (
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className={handleClassName}
        />
      ) : null}

      {handles.branchUpSource ? (
        <Handle
          id="branch-up"
          type="source"
          position={Position.Right}
          style={{ top: "32%" }}
          className={handleClassName}
        />
      ) : null}

      {handles.branchDownSource ? (
        <Handle
          id="branch-down"
          type="source"
          position={Position.Right}
          style={{ top: "68%" }}
          className={handleClassName}
        />
      ) : null}

      {handles.bottomTarget ? (
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          className={handleClassName}
        />
      ) : null}
    </div>
  );
}

function PipelineGroupNodeComponent() {
  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute inset-0 rounded-lg border border-slate-500/70 bg-slate-700/30" />
      <div className="pipeline-group-handle absolute inset-x-0 top-0 h-2.5 cursor-grab rounded-t-lg bg-slate-600/70 active:cursor-grabbing" />
    </div>
  );
}

export const PipelineFlowNode = memo(PipelineFlowNodeComponent);
export const PipelineGroupNode = memo(PipelineGroupNodeComponent);
