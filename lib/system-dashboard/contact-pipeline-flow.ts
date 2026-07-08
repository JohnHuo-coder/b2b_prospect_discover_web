import type { Edge, Node } from "@xyflow/react";

export type ContactNodeKind = "intro" | "step";

export const CONTACT_PIPELINE_FINAL_STAGES = [
  "get_email_using_apollo",
  "get_email_using_anymail_finder",
  "email_scraping",
  "email_classification",
] as const;

export type ContactFinalStage = (typeof CONTACT_PIPELINE_FINAL_STAGES)[number];

const CONTACT_FINAL_STAGE_SET = new Set<string>(CONTACT_PIPELINE_FINAL_STAGES);

export type ContactNodeData = {
  kind: ContactNodeKind;
  label: string;
  finalStage: ContactFinalStage | null;
  count: number;
};

export const CONTACT_INTRO_NODE_ID = "contact_intro";

const NODE_SIZE = 44;
const H_GAP = 72;
const MAIN_Y = 200;
const UPPER_Y = 80;
const MIDDLE_Y = 200;
const LOWER_Y = 320;

function stepNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  finalStage: ContactFinalStage
): Node<ContactNodeData> {
  return {
    id,
    type: "contactPipeline",
    position,
    data: { kind: "step", label, finalStage, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

function introNode(
  id: string,
  position: { x: number; y: number },
  label: string
): Node<ContactNodeData> {
  return {
    id,
    type: "contactPipeline",
    position,
    data: { kind: "intro", label, finalStage: null, count: 0 },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  };
}

const INTRO_X = 40;
const BRANCH_X = INTRO_X + NODE_SIZE + H_GAP;
const CHAIN_X = BRANCH_X + NODE_SIZE + H_GAP;

export const contactPipelineInitialNodes: Node<ContactNodeData>[] = [
  introNode(CONTACT_INTRO_NODE_ID, { x: INTRO_X, y: MAIN_Y }, "Contact lookup"),
  stepNode(
    "get_email_using_apollo",
    { x: BRANCH_X, y: UPPER_Y },
    "get_email_using_apollo",
    "get_email_using_apollo"
  ),
  stepNode(
    "get_email_using_anymail_finder",
    { x: BRANCH_X, y: MIDDLE_Y },
    "get_email_using_anymail_finder",
    "get_email_using_anymail_finder"
  ),
  stepNode(
    "email_scraping",
    { x: BRANCH_X, y: LOWER_Y },
    "email_scraping",
    "email_scraping"
  ),
  stepNode(
    "email_classification",
    { x: CHAIN_X, y: LOWER_Y },
    "email_classification",
    "email_classification"
  ),
];

export const contactPipelineInitialEdges: Edge[] = [
  {
    id: "c1",
    source: CONTACT_INTRO_NODE_ID,
    sourceHandle: "branch-up",
    target: "get_email_using_apollo",
    targetHandle: "left",
    label: "apollo",
  },
  {
    id: "c2",
    source: CONTACT_INTRO_NODE_ID,
    sourceHandle: "branch-mid",
    target: "get_email_using_anymail_finder",
    targetHandle: "left",
    label: "anymail finder",
  },
  {
    id: "c3",
    source: CONTACT_INTRO_NODE_ID,
    sourceHandle: "branch-down",
    target: "email_scraping",
    targetHandle: "left",
    label: "email scraping",
  },
  {
    id: "c4",
    source: "email_scraping",
    target: "email_classification",
  },
];

export type ContactNodeMeta = ContactNodeData & { id: string };

const contactNodeMetaById = new Map<string, ContactNodeMeta>(
  contactPipelineInitialNodes.map((node) => [
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

export function getContactNodeMeta(nodeId: string): ContactNodeMeta | null {
  return contactNodeMetaById.get(nodeId) ?? null;
}

export function mapContactWorkflowStageCounts(
  stages: Array<{ final_stage: string; failed_candidates: number }>
): Record<ContactFinalStage, number> {
  const counts = Object.fromEntries(
    CONTACT_PIPELINE_FINAL_STAGES.map((stage) => [stage, 0])
  ) as Record<ContactFinalStage, number>;

  for (const row of stages) {
    if (!CONTACT_FINAL_STAGE_SET.has(row.final_stage)) continue;
    counts[row.final_stage as ContactFinalStage] = row.failed_candidates;
  }

  return counts;
}

export function applyContactStageCountsToNodes(
  nodes: Node<ContactNodeData>[],
  stageCounts: Record<ContactFinalStage, number>
): Node<ContactNodeData>[] {
  return nodes.map((node) => {
    const finalStage = node.data.finalStage;
    const count =
      finalStage && CONTACT_FINAL_STAGE_SET.has(finalStage)
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
