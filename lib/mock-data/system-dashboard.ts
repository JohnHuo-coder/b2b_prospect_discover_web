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

export type FitscoreSummary = {
  totalInput: number;
  accepted: number;
  pendingScoring: number;
  belowCutoffRejected: number;
  failed: number;
};

export type FitscoreReviewLead = {
  id: string;
  company: string;
  status: "pending";
};

export const fitscoreSummary: FitscoreSummary = {
  totalInput: 20,
  accepted: 8,
  pendingScoring: 5,
  belowCutoffRejected: 4,
  failed: 3,
};

export const fitscoreReviewLeads: FitscoreReviewLead[] = [
  { id: "F004", company: "ClearPath Health", status: "pending" },
  { id: "F007", company: "Fortis Manufacturing", status: "pending" },
  { id: "F009", company: "Northwind Logistics", status: "pending" },
  { id: "F011", company: "BluePeak Analytics", status: "pending" },
  { id: "F015", company: "Summit Retail Group", status: "pending" },
];

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

export const infoAcquisitionSummaryScopes: InfoAcquisitionSummaryScope[] = [
  {
    id: "all",
    label: "All requirements",
    stats: { totalInput: 52, succeed: 8, failed: 44 },
  },
  {
    id: 1,
    label: "Requirement 1",
    stats: { totalInput: 52, succeed: 14, failed: 38 },
  },
  {
    id: 2,
    label: "Requirement 2",
    stats: { totalInput: 52, succeed: 11, failed: 41 },
  },
];

export type ContactCandidate = {
  id: string;
  company: string;
  status: "succeed" | "failed";
  final_stage: string;
  reason: string;
  fallback_from: string | null;
  selected_page_no_email_miss: number;
  email_not_confident_miss: number;
};

export const contactCandidates: ContactCandidate[] = [
  {
    id: "CT-201",
    company: "ClearPath Health",
    status: "succeed",
    final_stage: "email_confirmed",
    reason: "Primary contact email found via Apollo with high confidence.",
    fallback_from: null,
    selected_page_no_email_miss: 0,
    email_not_confident_miss: 0,
  },
  {
    id: "CT-202",
    company: "Fortis Manufacturing",
    status: "failed",
    final_stage: "website_scrape",
    reason: "No email on selected contact page; Apollo fallback also missed.",
    fallback_from: "apollo",
    selected_page_no_email_miss: 2,
    email_not_confident_miss: 1,
  },
  {
    id: "CT-203",
    company: "Northwind Logistics",
    status: "succeed",
    final_stage: "anymail_finder",
    reason: "Email resolved after Apollo miss via Anymail Finder.",
    fallback_from: "anymail_finder",
    selected_page_no_email_miss: 0,
    email_not_confident_miss: 0,
  },
  {
    id: "CT-204",
    company: "BluePeak Analytics",
    status: "failed",
    final_stage: "email_classification",
    reason: "Candidate email found but confidence below threshold.",
    fallback_from: "website_scrape",
    selected_page_no_email_miss: 0,
    email_not_confident_miss: 3,
  },
];

export type OutreachCandidate = {
  id: string;
  company: string;
  status: "succeed" | "failed";
  final_stage: string;
  reason: string;
};

export const outreachCandidates: OutreachCandidate[] = [
  {
    id: "OR-301",
    company: "ClearPath Health",
    status: "succeed",
    final_stage: "compliance_passed",
    reason: "Draft email passed length and tone compliance checks.",
  },
  {
    id: "OR-302",
    company: "Fortis Manufacturing",
    status: "failed",
    final_stage: "compliance_check",
    reason: "Email body exceeds maximum character limit (178 > 160).",
  },
  {
    id: "OR-303",
    company: "Northwind Logistics",
    status: "succeed",
    final_stage: "draft_generated",
    reason: "Outreach draft generated and ready for review.",
  },
  {
    id: "OR-304",
    company: "BluePeak Analytics",
    status: "failed",
    final_stage: "draft_generation",
    reason: "Insufficient lead context to generate compliant outreach copy.",
  },
];

export const acquisitionCandidates: AcquisitionCandidate[] = [
  {
    id: "IA-101",
    company: "ClearPath Health",
    status: "succeed",
    requirements: [
      {
        requirement_index: 1,
        requirement_text:
          "The property should have a calm, restful, and boutique atmosphere.",
        has_url_no_web_content_miss: 0,
        insufficient_content_miss: 0,
        status: "succeed",
        final_stage: "facts_extracted",
        reason: "Matched wellness positioning across about and amenities pages.",
        no_facts_extracted_miss: 0,
        no_best_url_subset_miss: 0,
      },
      {
        requirement_index: 2,
        requirement_text:
          "The hotel should serve health-conscious or wellness-oriented guests.",
        has_url_no_web_content_miss: 0,
        insufficient_content_miss: 0,
        status: "succeed",
        final_stage: "best_url_selected",
        reason: "Spa and nutrition content found on dedicated program page.",
        no_facts_extracted_miss: 0,
        no_best_url_subset_miss: 0,
      },
    ],
  },
  {
    id: "IA-102",
    company: "Fortis Manufacturing",
    status: "failed",
    requirements: [
      {
        requirement_index: 1,
        requirement_text:
          "The property should have a calm, restful, and boutique atmosphere.",
        has_url_no_web_content_miss: 2,
        insufficient_content_miss: 0,
        status: "failed",
        final_stage: "url_discovery",
        reason: "Homepage URL returned no scrapeable body content.",
        no_facts_extracted_miss: 1,
        no_best_url_subset_miss: 0,
      },
      {
        requirement_index: 2,
        requirement_text:
          "The hotel should serve health-conscious or wellness-oriented guests.",
        has_url_no_web_content_miss: 0,
        insufficient_content_miss: 3,
        status: "failed",
        final_stage: "content_review",
        reason: "Only 120 words extracted; below minimum content threshold.",
        no_facts_extracted_miss: 0,
        no_best_url_subset_miss: 1,
      },
    ],
  },
  {
    id: "IA-103",
    company: "Northwind Logistics",
    status: "succeed",
    requirements: [
      {
        requirement_index: 1,
        requirement_text:
          "The property should have a calm, restful, and boutique atmosphere.",
        has_url_no_web_content_miss: 0,
        insufficient_content_miss: 0,
        status: "succeed",
        final_stage: "facts_extracted",
        reason: "Boutique positioning confirmed in brand story section.",
        no_facts_extracted_miss: 0,
        no_best_url_subset_miss: 0,
      },
    ],
  },
  {
    id: "IA-104",
    company: "BluePeak Analytics",
    status: "failed",
    requirements: [
      {
        requirement_index: 1,
        requirement_text:
          "The property should have a calm, restful, and boutique atmosphere.",
        has_url_no_web_content_miss: 0,
        insufficient_content_miss: 0,
        status: "failed",
        final_stage: "fact_extraction",
        reason: "No supporting facts extracted from selected URLs.",
        no_facts_extracted_miss: 4,
        no_best_url_subset_miss: 0,
      },
    ],
  },
];
