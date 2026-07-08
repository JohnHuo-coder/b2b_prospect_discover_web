import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

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

export async function fetchComplianceCheckQueue(): Promise<{
  items: ComplianceCheckListItem[];
  total: number;
}> {
  const response = await authenticatedFetch(ENDPOINTS.HUMAN_REVIEW_COMPLIANCE_CHECK);

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
  candidateId: string
): Promise<ComplianceCheckDetail> {
  const response = await authenticatedFetch(
    ENDPOINTS.humanReviewComplianceCheckDetail(candidateId)
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
  requirementIndex: number
): Promise<ComplianceCheckRequirementFacts> {
  const response = await authenticatedFetch(
    ENDPOINTS.humanReviewComplianceCheckFacts(candidateId, requirementIndex)
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

export type EmailClassificationListItem = {
  id: string;
  company: string;
  website: string | null;
};

export type EmailClassificationEmailRow = {
  email: string;
  confidence_score: number | null;
  from_context: string | null;
  from_url: string | null;
  reason: string;
  likely_job_title: string | null;
  likely_contact_first_name: string | null;
  likely_contact_last_name: string | null;
  contact_role: string | null;
};

export type EmailClassificationDetail = {
  id: string;
  company: string;
  website: string | null;
  emails: EmailClassificationEmailRow[];
};

type EmailClassificationListApiRow = {
  id: string;
  company_name: string;
  website: string | null;
};

type EmailClassificationDetailApiResponse = {
  id: string;
  company_name: string;
  website: string | null;
  emails: EmailClassificationEmailRow[];
};

function mapEmailClassificationListRow(
  row: EmailClassificationListApiRow
): EmailClassificationListItem {
  const website = (row.website ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return {
    id: String(row.id),
    company: row.company_name,
    website: website || null,
  };
}

function mapEmailClassificationDetail(
  data: EmailClassificationDetailApiResponse
): EmailClassificationDetail {
  return {
    id: String(data.id),
    company: data.company_name,
    website: data.website,
    emails: data.emails ?? [],
  };
}

export async function fetchEmailClassificationQueue(): Promise<{
  items: EmailClassificationListItem[];
  total: number;
}> {
  const response = await authenticatedFetch(
    ENDPOINTS.HUMAN_REVIEW_EMAIL_CLASSIFICATION
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load email classification queue"
    );
  }

  const data = (await response.json()) as {
    items: EmailClassificationListApiRow[];
    total: number;
  };

  return {
    items: (data.items ?? []).map(mapEmailClassificationListRow),
    total: data.total ?? 0,
  };
}

export async function fetchEmailClassificationDetail(
  candidateId: string
): Promise<EmailClassificationDetail> {
  const response = await authenticatedFetch(
    ENDPOINTS.humanReviewEmailClassificationDetail(candidateId)
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load email classification detail"
    );
  }

  const data = (await response.json()) as EmailClassificationDetailApiResponse;
  return mapEmailClassificationDetail(data);
}
