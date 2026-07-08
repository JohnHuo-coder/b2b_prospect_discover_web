"use client";

import { memo } from "react";
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  OUTREACH_END_NODE_ID,
  OUTREACH_INTRO_NODE_ID,
  type OutreachNodeData,
  type OutreachNodeKind,
} from "@/lib/system-dashboard/outreach-pipeline-flow";
import { cn } from "@/lib/utils";

const handleClassName =
  "!h-2 !w-2 !rounded-full !border !border-slate-400 !bg-slate-100";

function getHandleConfig(id: string, kind: OutreachNodeKind) {
  const isIntro = id === OUTREACH_INTRO_NODE_ID;
  const isEnd = id === OUTREACH_END_NODE_ID;

  return {
    leftTarget: kind === "step" || isEnd,
    rightSource: kind === "step" && !isEnd,
    branchUpSource: isIntro,
    branchDownSource: isIntro,
  };
}

function CircularNode({
  label,
  kind,
  count,
}: {
  label: string;
  kind: OutreachNodeKind;
  count: number;
}) {
  return (
    <div className="group relative flex h-full w-full items-center justify-center">
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full border-2 text-xs font-semibold shadow-md transition-shadow group-hover:shadow-lg",
          kind === "intro" &&
            "border-dashed border-slate-400 bg-slate-700/40 text-slate-200",
          kind === "step" &&
            "cursor-pointer border-slate-200 bg-white text-slate-800",
          kind === "end" &&
            "border-emerald-400 bg-emerald-400 text-emerald-950"
        )}
      >
        {kind === "intro" ? "·" : kind === "end" ? "✓" : count}
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 max-w-[240px] -translate-x-1/2 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-center text-[10px] font-medium leading-snug text-slate-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

function OutreachPipelineFlowNodeComponent({
  data,
  id,
}: NodeProps<Node<OutreachNodeData>>) {
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
          style={{ top: "30%" }}
          className={handleClassName}
        />
      ) : null}

      {handles.branchDownSource ? (
        <Handle
          id="branch-down"
          type="source"
          position={Position.Right}
          style={{ top: "70%" }}
          className={handleClassName}
        />
      ) : null}
    </div>
  );
}

export const OutreachPipelineFlowNode = memo(OutreachPipelineFlowNodeComponent);
