import type { Edge, Node } from "@xyflow/react";

export type OutreachNodeKind = "intro" | "step" | "end";

export const OUTREACH_PIPELINE_FINAL_STAGES = [
  "generate_outreach_full_email",
  "generate_outreach_email_body",
  "compliance_check",
  "send_email",
] as const;

export type OutreachFinalStage = (typeof OUTREACH_PIPELINE_FINAL_STAGES)[number];

const OUTREACH_FINAL_STAGE_SET = new Set<string>(OUTREACH_PIPELINE_FINAL_STAGES);

export type OutreachNodeData = {
  kind: OutreachNodeKind;
  label: string;
  finalStage: OutreachFinalStage | null;
  count: number;
};

export const OUTREACH_INTRO_NODE_ID = "outreach_intro";
export const OUTREACH_END_NODE_ID = "outreach_end";

const NODE_SIZE = 44;
const H_GAP = 72;
const MAIN_Y = 200;
const UPPER_Y = 80;
const LOWER_Y = 320;

function stepNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  finalStage: OutreachFinalStage
): Node<OutreachNodeData> {
  return {
    id,
    type: "outreachPipeline",
    position,
    data: { kind: "step", label, finalStage, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

function introNode(
  id: string,
  position: { x: number; y: number },
  label: string
): Node<OutreachNodeData> {
  return {
    id,
    type: "outreachPipeline",
    position,
    data: { kind: "intro", label, finalStage: null, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

function endNode(
  id: string,
  position: { x: number; y: number },
  label: string
): Node<OutreachNodeData> {
  return {
    id,
    type: "outreachPipeline",
    position,
    data: { kind: "end", label, finalStage: null, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

const INTRO_X = 40;
const BRANCH_X = INTRO_X + NODE_SIZE + H_GAP;
const MERGE_X = BRANCH_X + NODE_SIZE + H_GAP;
const CHAIN_X = MERGE_X + NODE_SIZE + H_GAP;
const END_X = CHAIN_X + NODE_SIZE + H_GAP;

export const outreachPipelineInitialNodes: Node<OutreachNodeData>[] = [
  introNode(OUTREACH_INTRO_NODE_ID, { x: INTRO_X, y: MAIN_Y }, "Outreach"),
  stepNode(
    "generate_outreach_full_email",
    { x: BRANCH_X, y: UPPER_Y },
    "generate_outreach_full_email",
    "generate_outreach_full_email"
  ),
  stepNode(
    "generate_outreach_email_body",
    { x: BRANCH_X, y: LOWER_Y },
    "generate_outreach_email_body",
    "generate_outreach_email_body"
  ),
  stepNode(
    "compliance_check",
    { x: MERGE_X, y: MAIN_Y },
    "compliance_check",
    "compliance_check"
  ),
  stepNode(
    "send_email",
    { x: CHAIN_X, y: MAIN_Y },
    "send_email",
    "send_email"
  ),
  endNode(OUTREACH_END_NODE_ID, { x: END_X, y: MAIN_Y }, "End"),
];

export const outreachPipelineInitialEdges: Edge[] = [
  {
    id: "o1",
    source: OUTREACH_INTRO_NODE_ID,
    sourceHandle: "branch-up",
    target: "generate_outreach_full_email",
    targetHandle: "left",
    label: "full email",
  },
  {
    id: "o2",
    source: OUTREACH_INTRO_NODE_ID,
    sourceHandle: "branch-down",
    target: "generate_outreach_email_body",
    targetHandle: "left",
    label: "email body",
  },
  {
    id: "o3",
    source: "generate_outreach_full_email",
    target: "compliance_check",
    targetHandle: "left",
  },
  {
    id: "o4",
    source: "generate_outreach_email_body",
    target: "compliance_check",
    targetHandle: "left",
  },
  {
    id: "o5",
    source: "compliance_check",
    target: "send_email",
  },
  {
    id: "o6",
    source: "send_email",
    target: OUTREACH_END_NODE_ID,
    targetHandle: "left",
  },
];

export type OutreachNodeMeta = OutreachNodeData & { id: string };

const outreachNodeMetaById = new Map<string, OutreachNodeMeta>(
  outreachPipelineInitialNodes.map((node) => [
    node.id,
    {
      id: node.id,
      kind: node.data.kind,
      label: node.data.label,
      finalStage: node.data.finalStage,
      count: node.data.count,
    },
  ])
);

export function getOutreachNodeMeta(nodeId: string): OutreachNodeMeta | null {
  return outreachNodeMetaById.get(nodeId) ?? null;
}

export function mapOutreachWorkflowStageCounts(
  stages: Array<{ final_stage: string; not_success_candidates: number }>
): Record<OutreachFinalStage, number> {
  const counts = Object.fromEntries(
    OUTREACH_PIPELINE_FINAL_STAGES.map((stage) => [stage, 0])
  ) as Record<OutreachFinalStage, number>;

  for (const row of stages) {
    if (!OUTREACH_FINAL_STAGE_SET.has(row.final_stage)) continue;
    counts[row.final_stage as OutreachFinalStage] = row.not_success_candidates;
  }

  return counts;
}

export function applyOutreachStageCountsToNodes(
  nodes: Node<OutreachNodeData>[],
  stageCounts: Record<OutreachFinalStage, number>
): Node<OutreachNodeData>[] {
  return nodes.map((node) => {
    const finalStage = node.data.finalStage;
    const count =
      finalStage && OUTREACH_FINAL_STAGE_SET.has(finalStage)
        ? (stageCounts[finalStage] ?? 0)
        : 0;

    return {
      ...node,
      data: {
        ...node.data,
        count,
      },
    };
  });
}
