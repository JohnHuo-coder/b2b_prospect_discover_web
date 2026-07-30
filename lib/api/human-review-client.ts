import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import { appendVersionQuery } from "@/lib/api/version-query";

export type ComplianceCheckListItem = {
  id: string;
  company: string;
  website: string | null;
};

export type ComplianceCheckFactItem = {
  req_ind: number;
  facts: unknown;
  requirement: string;
};

export type ComplianceCheckDetail = {
  id: string;
  company: string;
  website: string | null;
  reason: string;
  issues: unknown;
  email_text: string;
  email_text_type: string;
  facts: ComplianceCheckFactItem[];
};

export type ComplianceCheckRequirementFacts = {
  req_ind: number;
  facts: unknown;
  requirement: string;
};

type ComplianceCheckListApiRow = {
  id: string;
  company_name: string;
  website: string | null;
};

type ComplianceCheckDetailApiResponse = {
  id: string;
  company_name: string;
  website: string | null;
  reason: string;
  issues: unknown;
  email_text: string;
  email_text_type: string;
  facts: ComplianceCheckFactItem[];
};

function mapComplianceCheckListRow(
  row: ComplianceCheckListApiRow
): ComplianceCheckListItem {
  const website = (row.website ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return {
    id: String(row.id),
    company: row.company_name,
    website: website || null,
  };
}

function mapComplianceCheckDetail(
  data: ComplianceCheckDetailApiResponse
): ComplianceCheckDetail {
  return {
    id: String(data.id),
    company: data.company_name,
    website: data.website,
    reason: data.reason,
    issues: data.issues,
    email_text: data.email_text,
    email_text_type: data.email_text_type,
    facts: data.facts ?? [],
  };
}

export async function fetchComplianceCheckQueue(version?: number): Promise<{
  items: ComplianceCheckListItem[];
  total: number;
}> {
  const response = await authenticatedFetch(
    appendVersionQuery(ENDPOINTS.HUMAN_REVIEW_COMPLIANCE_CHECK, version)
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load compliance check queue"
    );
  }

  const data = (await response.json()) as {
    items: ComplianceCheckListApiRow[];
    total: number;
  };

  return {
    items: (data.items ?? []).map(mapComplianceCheckListRow),
    total: data.total ?? 0,
  };
}

export async function fetchComplianceCheckDetail(
  candidateId: string,
  version?: number
): Promise<ComplianceCheckDetail> {
  const response = await authenticatedFetch(
    appendVersionQuery(ENDPOINTS.humanReviewComplianceCheckDetail(candidateId), version)
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load compliance check detail"
    );
  }

  const data = (await response.json()) as ComplianceCheckDetailApiResponse;
  return mapComplianceCheckDetail(data);
}

export type ComplianceCheckReviewAction = "keep" | "discard";

export async function updateComplianceCheckReviewDecision(
  candidateId: string,
  payload: import("@/lib/compliance-check/review-payload").ComplianceCheckDecisionPayload
): Promise<void> {
  const { submitHumanReviewComplianceDecision } = await import(
    "@/lib/api/compliance-check-decision"
  );
  return submitHumanReviewComplianceDecision(candidateId, payload);
}

export async function fetchComplianceCheckRequirementFacts(
  candidateId: string,
  requirementIndex: number,
  version?: number
): Promise<ComplianceCheckRequirementFacts> {
  const response = await authenticatedFetch(
    appendVersionQuery(
      ENDPOINTS.humanReviewComplianceCheckFacts(candidateId, requirementIndex),
      version
    )
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load requirement facts"
    );
  }

  const data = (await response.json()) as {
    req_ind: number;
    facts: unknown;
    requirement: string;
  };

  return {
    req_ind: data.req_ind,
    facts: data.facts,
    requirement: data.requirement ?? "",
  };
}
