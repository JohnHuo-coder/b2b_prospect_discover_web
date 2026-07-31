export const ACCESS_REQUEST_NOTE_LABEL = "Note for website developer";

export const ACCESS_REQUEST_NOTE_HELP =
  "Describe who you are and how you plan to use the platform. A detailed description helps us approve access faster.";

export const ACCESS_REQUEST_NOTE_PLACEHOLDER =
  "e.g. I lead partnerships at a B2B SaaS company and want to use Prospect Discover to find integration partners in Southeast Asia.";

export const PENDING_ACCESS_NOTE_STORAGE_KEY = "pendingAccessNote";

export const ACCESS_REQUEST_STATUS = {
  ACTIVE: "active",
  APPROVED: "approved",
  DENIED: "denied",
} as const;

export type AccessRequestStatus =
  (typeof ACCESS_REQUEST_STATUS)[keyof typeof ACCESS_REQUEST_STATUS];
