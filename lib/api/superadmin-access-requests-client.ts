import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import type { AccessRequestStatus } from "@/lib/constants/access-request";

export type SuperadminAccessRequest = {
  id: number | string;
  user_id: number | string;
  reason: string;
  status: AccessRequestStatus;
  created_at: string;
  email: string | null;
  role: string | null;
  user_approved: boolean | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
};

type AccessRequestsResponse = {
  requests: SuperadminAccessRequest[];
};

async function parseError(response: Response, fallback: string): Promise<never> {
  const error = await response.json().catch(() => ({}));
  throw new Error(
    typeof error.error === "string" ? error.error : fallback
  );
}

export async function fetchSuperadminAccessRequests(): Promise<
  SuperadminAccessRequest[]
> {
  const response = await authenticatedFetch(ENDPOINTS.SUPERADMIN_ACCESS_REQUESTS);

  if (!response.ok) {
    return parseError(response, "Failed to load access requests");
  }

  const data = (await response.json()) as AccessRequestsResponse;
  return data.requests ?? [];
}

export async function approveSuperadminAccessRequest(
  requestId: number | string
): Promise<void> {
  const response = await authenticatedFetch(
    ENDPOINTS.superadminAccessRequestApprove(requestId),
    { method: "POST" }
  );

  if (!response.ok) {
    return parseError(response, "Failed to approve access request");
  }
}

export async function denySuperadminAccessRequest(
  requestId: number | string
): Promise<void> {
  const response = await authenticatedFetch(
    ENDPOINTS.superadminAccessRequestDeny(requestId),
    { method: "POST" }
  );

  if (!response.ok) {
    return parseError(response, "Failed to deny access request");
  }
}

export async function approveAllSuperadminAccessRequests(): Promise<number> {
  const response = await authenticatedFetch(
    ENDPOINTS.SUPERADMIN_ACCESS_REQUESTS_APPROVE_ALL,
    { method: "POST" }
  );

  if (!response.ok) {
    return parseError(response, "Failed to approve all access requests");
  }

  const data = (await response.json()) as { approvedCount?: number };
  return Number(data.approvedCount) || 0;
}
