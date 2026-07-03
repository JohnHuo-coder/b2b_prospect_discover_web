export const ENDPOINTS = {
    AUTH_TOKEN: "/api/auth/token",
    AUTH_ME: "/api/auth/me",
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_BUSINESS_SIGNUP: "/api/auth/signup/business",
    AUTH_MEMBER_SIGNUP: "/api/auth/signup/member",
    LEADS: "/api/leads",
    DASHBOARD_SUMMARY: "/api/dashboard/summary",
    leadDetail: (id: string) => `/api/leads/${id}`,
  } as const;