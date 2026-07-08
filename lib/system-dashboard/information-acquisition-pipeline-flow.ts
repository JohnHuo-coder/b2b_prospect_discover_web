import type { Edge, Node } from "@xyflow/react";

export type PipelineNodeKind = "step" | "end" | "group";

/** All backend final_stage values shown on the pipeline diagram. */
export const PIPELINE_FINAL_STAGES = [
  "before_initial_url_best_subset_pick",
  "initial_url_best_subset_pick",
  "initial_web_scraping",
  "pick_more_urls_missing_requirement",
  "best_url_subset_pick_missing_requirement",
  "web_scraping_missing_requirement",
  "get_raw_content_for_url_missing_requirement",
  "content_condense",
  "pick_more_urls_initial_facts",
  "best_url_subset_pick_initial_facts",
  "web_scraping_initial_facts",
  "get_raw_content_for_url_initial_facts",
  "sufficiency_check",
  "pick_more_urls_remaining_info",
  "best_url_subset_pick_remaining_info",
  "web_scraping_remaining_info",
  "get_raw_content_for_url_remaining_info",
  "targeted_evidence_extraction",
  "dedup_merge_facts",
] as const;

export type PipelineFinalStage = (typeof PIPELINE_FINAL_STAGES)[number];

const PIPELINE_FINAL_STAGE_SET = new Set<string>(PIPELINE_FINAL_STAGES);

export type PipelineNodeData = {
  kind: PipelineNodeKind;
  label: string;
  finalStage: PipelineFinalStage | null;
  count: number;
};

export const FORK_NODE_IDS = [
  "initial_web",
  "content_condense",
  "sufficiency",
] as const;

export const PIPELINE_ENTRY_NODE_ID = "before_initial_url_best_subset_pick";

const NODE_SIZE = 44;
const GROUP_STEP_W = NODE_SIZE;
const GROUP_STEP_H = NODE_SIZE;
const GROUP_GAP = 16;
const GROUP_PAD = 14;
const GROUP_DRAG_H = 10;

/** Main horizontal lane and branch lanes (matches reference diagram). */
const MAIN_Y = 180;
const UPPER_Y = 28;
const LOWER_Y = 318;
const H_GAP = 28;

const RETRY_STEP_LABELS = [
  "pick_more_urls",
  "best_url_subset_pick",
  "web_scraping",
  "get_raw_content_for_url",
] as const;

function groupWidth() {
  const innerWidth =
    RETRY_STEP_LABELS.length * GROUP_STEP_W +
    (RETRY_STEP_LABELS.length - 1) * GROUP_GAP;
  return innerWidth + GROUP_PAD * 2;
}

function afterNode(x: number) {
  return x + NODE_SIZE + H_GAP;
}

function afterGroup(x: number) {
  return x + groupWidth() + H_GAP;
}

/** Precomputed x positions so groups sit between fork and merge nodes. */
const LAYOUT = (() => {
  const n0 = 0;
  const n1 = afterNode(n0);
  const n2 = afterNode(n1);
  const g1 = afterNode(n2) - 8;
  const n7 = afterGroup(g1);
  const g2 = afterNode(n7) - 8;
  const n12 = afterGroup(g2);
  const n13 = afterNode(n12);
  const g3 = n12 - 48;
  const n18 = afterGroup(g3);
  const n19 = afterNode(n18);
  const n20 = afterNode(n19);

  return { n0, n1, n2, g1, n7, g2, n12, n13, g3, n18, n19, n20 };
})();

function retryFinalStage(
  stepLabel: (typeof RETRY_STEP_LABELS)[number],
  suffix: string
): PipelineFinalStage {
  return `${stepLabel}_${suffix}` as PipelineFinalStage;
}

function createRetryGroup(
  groupId: string,
  suffix: string,
  position: { x: number; y: number }
) {
  const width = groupWidth();
  const groupHeight = GROUP_STEP_H + GROUP_PAD * 2 + GROUP_DRAG_H;

  const stepIds = RETRY_STEP_LABELS.map((label) => `${label}_${suffix}`);

  const nodes: Node<PipelineNodeData>[] = [
    {
      id: groupId,
      type: "pipelineGroup",
      position,
      data: {
        kind: "group",
        label: "",
        finalStage: null,
        count: 0,
      },
      style: { width, height: groupHeight },
      dragHandle: ".pipeline-group-handle",
      zIndex: 0,
      draggable: true,
    },
    ...stepIds.map((id, index) => ({
      id,
      type: "pipeline" as const,
      parentId: groupId,
      extent: "parent" as const,
      position: {
        x: GROUP_PAD + index * (GROUP_STEP_W + GROUP_GAP),
        y: GROUP_PAD + GROUP_DRAG_H,
      },
      data: {
        kind: "step" as const,
        label: RETRY_STEP_LABELS[index],
        finalStage: retryFinalStage(RETRY_STEP_LABELS[index], suffix),
        count: 0,
      },
      style: { width: GROUP_STEP_W, height: GROUP_STEP_H },
      zIndex: 1,
      draggable: false,
    })),
  ];

  const edges: Edge[] = stepIds.slice(0, -1).map((id, index) => ({
    id: `e_${id}_next`,
    source: id,
    sourceHandle: "right",
    target: stepIds[index + 1],
    targetHandle: "left",
  }));

  return {
    nodes,
    edges,
    firstStepId: stepIds[0],
    lastStepId: stepIds[stepIds.length - 1],
  };
}

function stepNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  finalStage: PipelineFinalStage
): Node<PipelineNodeData> {
  return {
    id,
    type: "pipeline",
    position,
    data: { kind: "step", label, finalStage, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

function endNode(
  id: string,
  position: { x: number; y: number },
  label: string
): Node<PipelineNodeData> {
  return {
    id,
    type: "pipeline",
    position,
    data: { kind: "end", label, finalStage: null, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

const groupMissing = createRetryGroup(
  "group_missing",
  "missing_requirement",
  { x: LAYOUT.g1, y: UPPER_Y }
);

const groupFacts = createRetryGroup(
  "group_facts",
  "initial_facts",
  { x: LAYOUT.g2, y: UPPER_Y }
);

const groupRemaining = createRetryGroup(
  "group_remaining",
  "remaining_info",
  { x: LAYOUT.g3, y: LOWER_Y }
);

export const pipelineInitialNodes: Node<PipelineNodeData>[] = [
  stepNode(
    PIPELINE_ENTRY_NODE_ID,
    { x: LAYOUT.n0, y: MAIN_Y },
    "before_initial_url_best_subset_pick",
    "before_initial_url_best_subset_pick"
  ),
  stepNode(
    "initial_url",
    { x: LAYOUT.n1, y: MAIN_Y },
    "initial_url_best_subset_pick",
    "initial_url_best_subset_pick"
  ),
  stepNode(
    "initial_web",
    { x: LAYOUT.n2, y: MAIN_Y },
    "initial_web_scraping",
    "initial_web_scraping"
  ),
  stepNode(
    "content_condense",
    { x: LAYOUT.n7, y: MAIN_Y },
    "content_condense",
    "content_condense"
  ),
  stepNode(
    "sufficiency",
    { x: LAYOUT.n12, y: MAIN_Y },
    "sufficiency_check",
    "sufficiency_check"
  ),
  endNode("end_success", { x: LAYOUT.n13, y: UPPER_Y }, "End"),
  stepNode(
    "targeted_evidence",
    { x: LAYOUT.n18, y: LOWER_Y },
    "targeted_evidence_extraction",
    "targeted_evidence_extraction"
  ),
  stepNode(
    "dedup_merge",
    { x: LAYOUT.n19, y: LOWER_Y },
    "dedup_merge_facts",
    "dedup_merge_facts"
  ),
  endNode("end_final", { x: LAYOUT.n20, y: LOWER_Y }, "End"),
  ...groupMissing.nodes,
  ...groupFacts.nodes,
  ...groupRemaining.nodes,
];

export const pipelineInitialEdges: Edge[] = [
  {
    id: "e0",
    source: PIPELINE_ENTRY_NODE_ID,
    target: "initial_url",
  },
  { id: "e1", source: "initial_url", target: "initial_web" },
  {
    id: "e2a",
    source: "initial_web",
    sourceHandle: "branch-up",
    target: groupMissing.firstStepId,
    targetHandle: "left",
    label: "missing requirement",
  },
  {
    id: "e2b",
    source: "initial_web",
    sourceHandle: "branch-down",
    target: "content_condense",
    targetHandle: "left",
    label: "no missing requirement",
  },
  {
    id: "e3",
    source: groupMissing.lastStepId,
    target: "content_condense",
    targetHandle: "left",
  },
  {
    id: "e4a",
    source: "content_condense",
    sourceHandle: "branch-up",
    target: groupFacts.firstStepId,
    targetHandle: "left",
    label: "no initial facts",
  },
  {
    id: "e4b",
    source: "content_condense",
    sourceHandle: "branch-down",
    target: "sufficiency",
    targetHandle: "left",
    label: "initial facts present",
  },
  {
    id: "e5",
    source: groupFacts.lastStepId,
    target: "sufficiency",
    targetHandle: "left",
  },
  {
    id: "e6a",
    source: "sufficiency",
    sourceHandle: "branch-up",
    target: "end_success",
    targetHandle: "left",
    label: "sufficient",
  },
  {
    id: "e6b",
    source: "sufficiency",
    sourceHandle: "branch-down",
    target: groupRemaining.firstStepId,
    targetHandle: "left",
    label: "remaining info",
  },
  {
    id: "e7",
    source: groupRemaining.lastStepId,
    target: "targeted_evidence",
    targetHandle: "left",
  },
  { id: "e8", source: "targeted_evidence", target: "dedup_merge" },
  { id: "e9", source: "dedup_merge", target: "end_final" },
  ...groupMissing.edges,
  ...groupFacts.edges,
  ...groupRemaining.edges,
];

export type PipelineNodeMeta = PipelineNodeData & { id: string };

const pipelineNodeMetaById = new Map<string, PipelineNodeMeta>(
  pipelineInitialNodes
    .filter((node) => node.type === "pipeline")
    .map((node) => [
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

export function getPipelineNodeMeta(nodeId: string): PipelineNodeMeta | null {
  return pipelineNodeMetaById.get(nodeId) ?? null;
}

export function getAllPipelineNodeMetas(): PipelineNodeMeta[] {
  return [...pipelineNodeMetaById.values()].sort((a, b) => {
    const aIndex = a.finalStage
      ? PIPELINE_FINAL_STAGES.indexOf(a.finalStage)
      : 999;
    const bIndex = b.finalStage
      ? PIPELINE_FINAL_STAGES.indexOf(b.finalStage)
      : 999;
    return aIndex - bIndex;
  });
}

export function mapWorkflowStageCounts(
  stages: Array<{ final_stage: string; failed_candidates: number }>
): Record<PipelineFinalStage, number> {
  const counts = Object.fromEntries(
    PIPELINE_FINAL_STAGES.map((stage) => [stage, 0])
  ) as Record<PipelineFinalStage, number>;

  for (const row of stages) {
    if (!PIPELINE_FINAL_STAGE_SET.has(row.final_stage)) continue;
    counts[row.final_stage as PipelineFinalStage] = row.failed_candidates;
  }

  return counts;
}

export function applyStageCountsToNodes(
  nodes: Node<PipelineNodeData>[],
  stageCounts: Record<PipelineFinalStage, number>
): Node<PipelineNodeData>[] {
  return nodes.map((node) => {
    if (node.type !== "pipeline") return node;

    const finalStage = node.data.finalStage;
    const count =
      finalStage && PIPELINE_FINAL_STAGE_SET.has(finalStage)
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
