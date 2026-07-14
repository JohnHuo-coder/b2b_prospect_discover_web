export const ENDPOINTS = {
    AUTH_TOKEN: "/api/auth/token",
    AUTH_ME: "/api/auth/me",
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_BUSINESS_SIGNUP: "/api/auth/signup/business",
    AUTH_MEMBER_SIGNUP: "/api/auth/signup/member",
    memberRole: (uid: string) => `/api/auth/members/${uid}/role`,
    ADMIN_MEMBERS: "/api/admin/members",
    LEADS: "/api/leads",
    DASHBOARD_SUMMARY: "/api/dashboard/summary",
    DASHBOARD_START_DISCOVERY: "/api/dashboard/start-discovery",
    BUSINESS_CONFIG: "/api/business/config",
    BUSINESS_CONFIG_CANDIDATES_PER_RUN: "/api/business/config/candidates-per-run",
    BUSINESS_SEARCH: "/api/business/search",
    BUSINESS_JOIN: "/api/business/join",
    BUSINESS_CONFIG_REPHRASE: "/api/business/config/requirements/rephrase",
    SYSTEM_DASHBOARD_INFO_ACQUISITION:
      "/api/system-dashboard/information-acquisition",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_SUMMARY:
      "/api/system-dashboard/information-acquisition/summary",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_WORKFLOW:
      "/api/system-dashboard/information-acquisition/workflow",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_WORKFLOW_STAGE:
      "/api/system-dashboard/information-acquisition/workflow/stage",
    SYSTEM_DASHBOARD_FITSCORE_SUMMARY: "/api/system-dashboard/fitscore/summary",
    SYSTEM_DASHBOARD_FITSCORE: "/api/system-dashboard/fitscore",
    infoAcquisitionDetail: (id: string) =>
      `/api/system-dashboard/information-acquisition/${id}`,
    fitscoreDetail: (id: string) => `/api/system-dashboard/fitscore/${id}`,
    SYSTEM_DASHBOARD_CONTACT: "/api/system-dashboard/contact",
    SYSTEM_DASHBOARD_CONTACT_SUMMARY: "/api/system-dashboard/contact/summary",
    contactEmailSourceDetail: (source: "apollo" | "anymail" | "website") =>
      `/api/system-dashboard/contact/email-source/${source}`,
    contactDetail: (id: string) => `/api/system-dashboard/contact/${id}`,
    SYSTEM_DASHBOARD_OUTREACH: "/api/system-dashboard/outreach",
    SYSTEM_DASHBOARD_OUTREACH_SUMMARY: "/api/system-dashboard/outreach/summary",
    SYSTEM_DASHBOARD_OUTREACH_WORKFLOW:
      "/api/system-dashboard/outreach/workflow",
    SYSTEM_DASHBOARD_OUTREACH_WORKFLOW_STAGE:
      "/api/system-dashboard/outreach/workflow/stage",
    outreachDetail: (id: string) => `/api/system-dashboard/outreach/${id}`,
    leadDetail: (id: string) => `/api/leads/${id}`,
    HUMAN_REVIEW_COMPLIANCE_CHECK: "/api/human-review/compliance-check",
    humanReviewComplianceCheckDetail: (id: string) =>
      `/api/human-review/compliance-check/${id}`,
    humanReviewComplianceCheckFacts: (id: string, requirementIndex: number) =>
      `/api/human-review/compliance-check/${id}/facts?requirement_index=${requirementIndex}`,
    HUMAN_REVIEW_EMAIL_CLASSIFICATION: "/api/human-review/email-classification",
    humanReviewEmailClassificationDetail: (id: string) =>
      `/api/human-review/email-classification/${id}`,
  } as const;