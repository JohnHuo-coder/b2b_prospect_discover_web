import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import type {
  ContactEmailSource,
  ContactEmailSourceBreakdown,
} from "@/lib/system-dashboard/contact-status";

export type AcquisitionRequirementResult = {
  requirement_index: number;
  requirement_text: string;
  has_url_no_web_content_miss: number;
  insufficient_content_miss: number;
  status: string;
  final_stage: string;
  reason: string;
  no_facts_extracted_miss: number;
  no_best_url_subset_miss: number;
};

export type AcquisitionCandidate = {
  id: string;
  company: string;
  status: "succeed" | "failed";
  requirements: AcquisitionRequirementResult[];
};

export type InfoAcquisitionCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: "succeed" | "failed";
};

type InfoAcquisitionApiRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  overall_status: "success" | "failed";
};

type InfoAcquisitionDetailApiResponse = {
  id: string;
  company_name: string;
  website: string | null;
  overall_status: "success" | "failed";
  requirements: Array<
    Omit<AcquisitionRequirementResult, "requirement_index"> & {
      requirement_index: number | null;
    }
  >;
};

function mapInfoAcquisitionRow(
  row: InfoAcquisitionApiRow
): InfoAcquisitionCandidate {
  return {
    id: String(row.id),
    company: row.company_name,
    website: row.website,
    status: row.overall_status === "success" ? "succeed" : "failed",
  };
}

function mapInfoAcquisitionDetail(
  data: InfoAcquisitionDetailApiResponse
): AcquisitionCandidate {
  return {
    id: String(data.id),
    company: data.company_name,
    status: data.overall_status === "success" ? "succeed" : "failed",
    requirements: (data.requirements ?? []).map((row, index) => ({
      requirement_index: row.requirement_index ?? index + 1,
      requirement_text: row.requirement_text,
      has_url_no_web_content_miss: row.has_url_no_web_content_miss,
      insufficient_content_miss: row.insufficient_content_miss,
      status: row.status,
      final_stage: row.final_stage,
      reason: row.reason,
      no_facts_extracted_miss: row.no_facts_extracted_miss,
      no_best_url_subset_miss: row.no_best_url_subset_miss,
    })),
  };
}

export type InfoAcquisitionStatusFilter = "all" | "succeed" | "failed";

export type InfoAcquisitionSummaryStats = {
  totalInput: number;
  succeed: number;
  failed: number;
};

export type InfoAcquisitionSummaryScope = {
  id: "all" | number;
  label: string;
  stats: InfoAcquisitionSummaryStats;
};

type InfoAcquisitionSummaryApiResponse = {
  overall: InfoAcquisitionSummaryStats;
  requirements: Array<{
    requirement_index: number;
    requirement_text: string;
  }>;
};

type InfoAcquisitionRequirementSummaryApiResponse =
  InfoAcquisitionSummaryStats & {
    requirement_index: number;
    requirement_text: string;
  };

export async function fetchInfoAcquisitionSummary(): Promise<{
  overall: InfoAcquisitionSummaryStats;
  requirements: Array<{
    requirement_index: number;
    requirement_text: string;
  }>;
}> {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_INFO_ACQUISITION_SUMMARY
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load information acquisition summary"
    );
  }

  return (await response.json()) as InfoAcquisitionSummaryApiResponse;
}

export async function fetchInfoAcquisitionRequirementSummary(
  requirementIndex: number
): Promise<InfoAcquisitionRequirementSummaryApiResponse> {
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_INFO_ACQUISITION_SUMMARY}?requirement_index=${requirementIndex}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load requirement summary"
    );
  }

  return (await response.json()) as InfoAcquisitionRequirementSummaryApiResponse;
}

export type InfoAcquisitionWorkflowStageCount = {
  final_stage: string;
  failed_candidates: number;
};

export type InfoAcquisitionWorkflowByReq = {
  requirement_index: number;
  requirement_text: string;
  stages: InfoAcquisitionWorkflowStageCount[];
};

export async function fetchInfoAcquisitionWorkflowByReq(
  requirementIndex: number
): Promise<InfoAcquisitionWorkflowByReq> {
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_INFO_ACQUISITION_WORKFLOW}?requirement_index=${requirementIndex}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load pipeline workflow counts"
    );
  }

  return (await response.json()) as InfoAcquisitionWorkflowByReq;
}

export type InfoAcquisitionStageDetailCandidate = {
  id: string;
  company: string;
  website: string | null;
  reason: string;
  status: "failed";
};

export async function fetchInfoAcquisitionStageDetail(params: {
  requirementIndex: number;
  finalStage: string;
}): Promise<{
  requirement_index: number;
  final_stage: string;
  candidates: InfoAcquisitionStageDetailCandidate[];
}> {
  const query = new URLSearchParams({
    requirement_index: String(params.requirementIndex),
    final_stage: params.finalStage,
  });

  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_INFO_ACQUISITION_WORKFLOW_STAGE}?${query.toString()}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load stage candidates"
    );
  }

  return (await response.json()) as {
    requirement_index: number;
    final_stage: string;
    candidates: InfoAcquisitionStageDetailCandidate[];
  };
}

export async function fetchInfoAcquisitionCandidates(params?: {
  search?: string;
  status?: InfoAcquisitionStatusFilter;
  page?: number;
  limit?: number;
}): Promise<{ candidates: InfoAcquisitionCandidate[]; total: number }> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = query.size
    ? `${ENDPOINTS.SYSTEM_DASHBOARD_INFO_ACQUISITION}?${query.toString()}`
    : ENDPOINTS.SYSTEM_DASHBOARD_INFO_ACQUISITION;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load information acquisition candidates"
    );
  }

  const data = (await response.json()) as {
    candidates: InfoAcquisitionApiRow[];
    total: number;
  };

  return {
    candidates: (data.candidates ?? []).map(mapInfoAcquisitionRow),
    total: data.total ?? 0,
  };
}

export async function fetchInfoAcquisitionCandidateDetail(
  candidateId: string
): Promise<AcquisitionCandidate> {
  const response = await authenticatedFetch(
    ENDPOINTS.infoAcquisitionDetail(candidateId)
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load candidate details"
    );
  }

  const data = (await response.json()) as InfoAcquisitionDetailApiResponse;
  return mapInfoAcquisitionDetail(data);
}

export type FitscoreSummaryStats = {
  totalInput: number;
  accepted: number;
  rejected: number;
  failed: number;
};

export type FitscoreSummaryScope = {
  id: "all" | number;
  label: string;
  stats: FitscoreSummaryStats;
};

type FitscoreSummaryApiResponse = {
  overall: FitscoreSummaryStats;
  requirements: Array<{
    requirement_index: number;
    requirement_text: string;
  }>;
};

type FitscoreRequirementSummaryApiResponse = FitscoreSummaryStats & {
  requirement_index: number;
  requirement_text: string;
};

export async function fetchFitscoreSummary(): Promise<{
  overall: FitscoreSummaryStats;
  requirements: Array<{
    requirement_index: number;
    requirement_text: string;
  }>;
}> {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_FITSCORE_SUMMARY
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load fitscore summary"
    );
  }

  return (await response.json()) as FitscoreSummaryApiResponse;
}

export async function fetchFitscoreRequirementSummary(
  requirementIndex: number
): Promise<FitscoreRequirementSummaryApiResponse> {
  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_FITSCORE_SUMMARY}?requirement_index=${requirementIndex}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load requirement summary"
    );
  }

  return (await response.json()) as FitscoreRequirementSummaryApiResponse;
}

export type FitscoreStatus = "accepted" | "rejected" | "failed";

export type FitscoreStatusFilter = "all" | FitscoreStatus;

export type FitscoreRequirementResult = {
  requirement_index: number;
  requirement_text: string;
  score: number | null;
  reason: string;
  supporting_facts: unknown;
  status: string;
};

export type FitscoreCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: FitscoreStatus;
  requirements: FitscoreRequirementResult[];
};

export type FitscoreTableCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: FitscoreStatus;
};

type FitscoreApiRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  overall_status: FitscoreStatus;
};

type FitscoreDetailApiResponse = {
  id: string;
  company_name: string;
  website: string | null;
  overall_status: FitscoreStatus;
  requirements: Array<
    Omit<FitscoreRequirementResult, "requirement_index"> & {
      requirement_index: number | null;
    }
  >;
};

function mapFitscoreRow(row: FitscoreApiRow): FitscoreTableCandidate {
  return {
    id: String(row.id),
    company: row.company_name,
    website: row.website,
    status: row.overall_status,
  };
}

function mapFitscoreDetail(data: FitscoreDetailApiResponse): FitscoreCandidate {
  return {
    id: String(data.id),
    company: data.company_name,
    website: data.website,
    status: data.overall_status,
    requirements: (data.requirements ?? []).map((row, index) => ({
      requirement_index: row.requirement_index ?? index + 1,
      requirement_text: row.requirement_text,
      score: row.score,
      reason: row.reason,
      supporting_facts: row.supporting_facts,
      status: row.status,
    })),
  };
}

export async function fetchFitscoreCandidates(params?: {
  search?: string;
  status?: FitscoreStatusFilter;
  page?: number;
  limit?: number;
}): Promise<{ candidates: FitscoreTableCandidate[]; total: number }> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = query.size
    ? `${ENDPOINTS.SYSTEM_DASHBOARD_FITSCORE}?${query.toString()}`
    : ENDPOINTS.SYSTEM_DASHBOARD_FITSCORE;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load fitscore candidates"
    );
  }

  const data = (await response.json()) as {
    candidates: FitscoreApiRow[];
    total: number;
  };

  return {
    candidates: (data.candidates ?? []).map(mapFitscoreRow),
    total: data.total ?? 0,
  };
}

export async function fetchFitscoreCandidateDetail(
  candidateId: string
): Promise<FitscoreCandidate> {
  const response = await authenticatedFetch(ENDPOINTS.fitscoreDetail(candidateId));

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load candidate details"
    );
  }

  const data = (await response.json()) as FitscoreDetailApiResponse;
  return mapFitscoreDetail(data);
}

export type ContactStatus = "succeed" | "failed";

export type ContactStatusFilter = "all" | ContactStatus;

export type ContactSummaryStats = {
  totalInput: number;
  succeed: number;
  failed: number;
  successApollo: number;
  successAnymail: number;
  emailSources: ContactEmailSourceBreakdown;
};

export async function fetchContactSummary(): Promise<ContactSummaryStats> {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_CONTACT_SUMMARY
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load contact summary"
    );
  }

  return (await response.json()) as ContactSummaryStats;
}

export type ContactEmailSourceDetailItem = {
  label: string;
  count: number;
};

export async function fetchContactEmailSourceDetail(
  source: "apollo" | "anymail" | "website"
): Promise<ContactEmailSourceDetailItem[]> {
  const response = await authenticatedFetch(
    ENDPOINTS.contactEmailSourceDetail(source)
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load email source details"
    );
  }

  const data = (await response.json()) as {
    items: ContactEmailSourceDetailItem[];
  };

  return data.items ?? [];
}

export type ContactEmail = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  contact_role: string | null;
  from: string | null;
};

export type ContactCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: ContactStatus;
  final_stage: string;
  reason: string;
  fallback_from: string | null;
  selected_page_no_email_miss: number;
  email_not_confident_miss: number;
  emails: ContactEmail[];
};

export type ContactTableCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: ContactStatus;
  email_source: ContactEmailSource | null;
};

type ContactApiRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  status: ContactStatus;
  email_source?: ContactEmailSource | null;
};

type ContactDetailApiResponse = {
  id: string;
  company_name: string;
  website: string | null;
  status: ContactStatus;
  final_stage: string;
  reason: string;
  fallback_from: string | null;
  selected_page_no_email_miss: number;
  email_not_confident_miss: number;
  emails: ContactEmail[];
};

function mapContactRow(row: ContactApiRow): ContactTableCandidate {
  return {
    id: String(row.id),
    company: row.company_name,
    website: row.website,
    status: row.status,
    email_source: row.email_source ?? null,
  };
}

function mapContactDetail(data: ContactDetailApiResponse): ContactCandidate {
  return {
    id: String(data.id),
    company: data.company_name,
    website: data.website,
    status: data.status,
    final_stage: data.final_stage,
    reason: data.reason,
    fallback_from: data.fallback_from,
    selected_page_no_email_miss: data.selected_page_no_email_miss,
    email_not_confident_miss: data.email_not_confident_miss,
    emails: data.emails ?? [],
  };
}

export async function fetchContactCandidates(params?: {
  search?: string;
  status?: ContactStatusFilter;
  page?: number;
  limit?: number;
}): Promise<{ candidates: ContactTableCandidate[]; total: number }> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = query.size
    ? `${ENDPOINTS.SYSTEM_DASHBOARD_CONTACT}?${query.toString()}`
    : ENDPOINTS.SYSTEM_DASHBOARD_CONTACT;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load contact candidates"
    );
  }

  const data = (await response.json()) as {
    candidates: ContactApiRow[];
    total: number;
  };

  return {
    candidates: (data.candidates ?? []).map(mapContactRow),
    total: data.total ?? 0,
  };
}

export async function fetchContactCandidateDetail(
  candidateId: string
): Promise<ContactCandidate> {
  const response = await authenticatedFetch(ENDPOINTS.contactDetail(candidateId));

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load candidate details"
    );
  }

  const data = (await response.json()) as ContactDetailApiResponse;
  return mapContactDetail(data);
}

export type ContactWorkflowStageCount = {
  final_stage: string;
  failed_candidates: number;
};

export type ContactStageDetailCandidate = {
  id: string;
  company: string;
  website: string | null;
  reason: string;
};

export async function fetchContactWorkflow(): Promise<{
  stages: ContactWorkflowStageCount[];
}> {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_CONTACT_WORKFLOW
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load contact workflow counts"
    );
  }

  return (await response.json()) as { stages: ContactWorkflowStageCount[] };
}

export async function fetchContactStageDetail(finalStage: string): Promise<{
  final_stage: string;
  candidates: ContactStageDetailCandidate[];
}> {
  const query = new URLSearchParams({ final_stage: finalStage });

  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_CONTACT_WORKFLOW_STAGE}?${query.toString()}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load stage candidates"
    );
  }

  return (await response.json()) as {
    final_stage: string;
    candidates: ContactStageDetailCandidate[];
  };
}

export type OutreachStatus =
  | "succeed"
  | "failed"
  | "require_review"
  | "pending"
  | "rejected";

export type OutreachReviewAction = "keep" | "discard";

export type OutreachStatusFilter = "all" | OutreachStatus;

export type OutreachSummaryStats = {
  totalInput: number;
  succeed: number;
  totalSucceed: number;
  failed: number;
  requireReview: number;
  humanReviewTotal: number;
  humanReviewPending: number;
  humanReviewApproved: number;
  humanReviewRejected: number;
  modifiedCandidates: number;
  analyzedCandidates: number;
  majorChangedCandidates: number;
  minorChangedCandidates: number;
  approvedWithoutModification: number;
};

export async function fetchOutreachSummary(): Promise<OutreachSummaryStats> {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_OUTREACH_SUMMARY
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load outreach summary"
    );
  }

  return (await response.json()) as OutreachSummaryStats;
}

export type OutreachWorkflowStageCount = {
  final_stage: string;
  not_success_candidates: number;
};

export type OutreachStageDetailCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: OutreachStatus;
  human_approved_tag: boolean;
  reason: string;
};

export async function fetchOutreachWorkflow(): Promise<{
  stages: OutreachWorkflowStageCount[];
}> {
  const response = await authenticatedFetch(
    ENDPOINTS.SYSTEM_DASHBOARD_OUTREACH_WORKFLOW
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load outreach workflow counts"
    );
  }

  return (await response.json()) as { stages: OutreachWorkflowStageCount[] };
}

export async function fetchOutreachStageDetail(finalStage: string): Promise<{
  final_stage: string;
  candidates: OutreachStageDetailCandidate[];
}> {
  const query = new URLSearchParams({ final_stage: finalStage });

  const response = await authenticatedFetch(
    `${ENDPOINTS.SYSTEM_DASHBOARD_OUTREACH_WORKFLOW_STAGE}?${query.toString()}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load stage candidates"
    );
  }

  return (await response.json()) as {
    final_stage: string;
    candidates: OutreachStageDetailCandidate[];
  };
}

export type OutreachEmail = {
  email: string;
  outreach_email: string | null;
};

export type OutreachNeedReviewEmail = {
  reason: string;
  issues: unknown;
  email_text: string;
  email_text_type: string;
};

export type OutreachCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: OutreachStatus;
  human_approved_tag: boolean;
  human_review_modified: boolean | null;
  human_review_analytic_status: string | null;
  human_review_edit_severity: string | null;
  final_stage: string;
  reason: string;
  emails: OutreachEmail[];
  need_review_email: OutreachNeedReviewEmail | null;
};

export type OutreachTableCandidate = {
  id: string;
  company: string;
  website: string | null;
  status: OutreachStatus;
  human_approved_tag: boolean;
};

type OutreachApiRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  status: OutreachStatus;
  human_approved_tag?: boolean;
};

type OutreachDetailApiResponse = {
  id: string;
  company_name: string;
  website: string | null;
  status: OutreachStatus;
  human_approved_tag?: boolean;
  human_review_modified?: boolean | null;
  human_review_analytic_status?: string | null;
  human_review_edit_severity?: string | null;
  final_stage: string;
  reason: string;
  emails: OutreachEmail[];
  need_review_email: OutreachNeedReviewEmail | null;
};

function mapOutreachRow(row: OutreachApiRow): OutreachTableCandidate {
  return {
    id: String(row.id),
    company: row.company_name,
    website: row.website,
    status: row.status,
    human_approved_tag: row.human_approved_tag ?? false,
  };
}

function mapOutreachDetail(data: OutreachDetailApiResponse): OutreachCandidate {
  return {
    id: data.id,
    company: data.company_name,
    website: data.website,
    status: data.status,
    human_approved_tag: data.human_approved_tag ?? false,
    human_review_modified: data.human_review_modified ?? null,
    human_review_analytic_status: data.human_review_analytic_status ?? null,
    human_review_edit_severity: data.human_review_edit_severity ?? null,
    final_stage: data.final_stage,
    reason: data.reason,
    emails: data.emails ?? [],
    need_review_email: data.need_review_email ?? null,
  };
}

export async function fetchOutreachCandidates(params?: {
  search?: string;
  status?: OutreachStatusFilter;
  page?: number;
  limit?: number;
}): Promise<{ candidates: OutreachTableCandidate[]; total: number }> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = query.size
    ? `${ENDPOINTS.SYSTEM_DASHBOARD_OUTREACH}?${query.toString()}`
    : ENDPOINTS.SYSTEM_DASHBOARD_OUTREACH;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load outreach candidates"
    );
  }

  const data = (await response.json()) as {
    candidates: OutreachApiRow[];
    total: number;
  };

  return {
    candidates: (data.candidates ?? []).map(mapOutreachRow),
    total: data.total ?? 0,
  };
}

export async function fetchOutreachCandidateDetail(
  candidateId: string
): Promise<OutreachCandidate> {
  const response = await authenticatedFetch(ENDPOINTS.outreachDetail(candidateId));

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to load outreach candidate details"
    );
  }

  const data = (await response.json()) as OutreachDetailApiResponse;
  return mapOutreachDetail(data);
}

export async function updateOutreachReviewDecision(
  candidateId: string,
  payload: import("@/lib/compliance-check/review-payload").ComplianceCheckDecisionPayload
): Promise<void> {
  const { submitOutreachComplianceDecision } = await import(
    "@/lib/api/compliance-check-decision"
  );
  return submitOutreachComplianceDecision(candidateId, payload);
}
