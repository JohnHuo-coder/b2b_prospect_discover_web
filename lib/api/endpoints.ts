export const ENDPOINTS = {
    AUTH_TOKEN: "/api/auth/token",
    AUTH_ME: "/api/auth/me",
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_BUSINESS_SIGNUP: "/api/auth/signup/business",
    AUTH_MEMBER_SIGNUP: "/api/auth/signup/member",
    AUTH_ACCESS_REQUEST: "/api/auth/access-request",
    memberRole: (uid: string) => `/api/auth/members/${uid}/role`,
    ADMIN_MEMBERS: "/api/admin/members",
    SUPERADMIN_COMPANIES: "/api/superadmin/companies",
    SUPERADMIN_COMPANIES_MONITOR: "/api/superadmin/companies/monitor",
    SUPERADMIN_ACCESS_REQUESTS: "/api/superadmin/access-requests",
    SUPERADMIN_ACCESS_REQUESTS_APPROVE_ALL:
      "/api/superadmin/access-requests/approve-all",
    superadminAccessRequestApprove: (id: number | string) =>
      `/api/superadmin/access-requests/${id}/approve`,
    superadminAccessRequestDeny: (id: number | string) =>
      `/api/superadmin/access-requests/${id}/deny`,
    LEADS: "/api/leads",
    DASHBOARD_SUMMARY: "/api/dashboard/summary",
    DASHBOARD_DISCOVERY_QUOTA: "/api/dashboard/discovery-quota",
    DASHBOARD_START_DISCOVERY: "/api/dashboard/start-discovery",
    JOBS: "/api/jobs",
    BUSINESS_CONFIG: "/api/business/config",
    BUSINESS_INDUSTRIES: "/api/business/industries",
    BUSINESS_CONFIG_CANDIDATES_PER_RUN: "/api/business/config/candidates-per-run",
    BUSINESS_SEARCH: "/api/business/search",
    BUSINESS_JOIN: "/api/business/join",
    BUSINESS_LEAVE: "/api/business/leave",
    BUSINESS_CREATE: "/api/business/create",
    BUSINESS_CONFIG_REPHRASE: "/api/business/config/requirements/rephrase",
    SYSTEM_DASHBOARD_INFO_ACQUISITION:
      "/api/system-dashboard/information-acquisition",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_SUMMARY:
      "/api/system-dashboard/information-acquisition/summary",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_WORKFLOW:
      "/api/system-dashboard/information-acquisition/workflow",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_WORKFLOW_STAGE:
      "/api/system-dashboard/information-acquisition/workflow/stage",
    SYSTEM_DASHBOARD_INFO_ACQUISITION_WEBSITE_URL_FAILURES:
      "/api/system-dashboard/information-acquisition/website-url/failures",
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
    SYSTEM_DASHBOARD_USAGE_BUSINESS: "/api/system-dashboard/usage/business",
    SYSTEM_DASHBOARD_USAGE_CANDIDATE_SUMMARY:
      "/api/system-dashboard/usage/candidate/summary",
    SYSTEM_DASHBOARD_USAGE_CANDIDATE_STAGES:
      "/api/system-dashboard/usage/candidate/stages",
    SYSTEM_DASHBOARD_USAGE_CANDIDATE_STAGE_DETAIL:
      "/api/system-dashboard/usage/candidate/stages/detail",
    SYSTEM_DASHBOARD_USAGE_CANDIDATE_LEADS:
      "/api/system-dashboard/usage/candidate/leads",
    SYSTEM_DASHBOARD_API_ERRORS_CONFIGS:
      "/api/system-dashboard/api-errors/configs",
    SYSTEM_DASHBOARD_API_ERRORS: "/api/system-dashboard/api-errors",
    SYSTEM_DASHBOARD_API_ERRORS_APIS: "/api/system-dashboard/api-errors/apis",
    SYSTEM_DASHBOARD_API_ERRORS_EXECUTIONS:
      "/api/system-dashboard/api-errors/executions",
    outreachDetail: (id: string) => `/api/system-dashboard/outreach/${id}`,
    leadDetail: (id: string) => `/api/leads/${id}`,
    leadContact: (id: string) => `/api/leads/${id}/contacts`,
    leadContactOutreach: (id: string) => `/api/leads/${id}/contacts/outreach`,
    leadContactSend: (id: string) => `/api/leads/${id}/contacts/send`,
    GMAIL_STATUS: "/api/gmail/status",
    GMAIL_CONNECT: "/api/gmail/connect",
    HUMAN_REVIEW_COMPLIANCE_CHECK: "/api/human-review/compliance-check",
    humanReviewComplianceCheckDetail: (id: string) =>
      `/api/human-review/compliance-check/${id}`,
    humanReviewComplianceCheckFacts: (id: string, requirementIndex: number) =>
      `/api/human-review/compliance-check/${id}/facts?requirement_index=${requirementIndex}`,
  } as const;