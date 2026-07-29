import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type BusinessSearchResult = {
  firebaseUid: string;
  email: string;
  role: string;
  business_id: number | string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
};

type BusinessSearchResponse = {
  businesses: BusinessSearchResult[];
};

export async function searchBusinesses(
  search: string
): Promise<BusinessSearchResult[]> {
  const params = new URLSearchParams({ search: search.trim() });
  const response = await authenticatedFetch(
    `${ENDPOINTS.BUSINESS_SEARCH}?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to search businesses"
    );
  }

  const data = (await response.json()) as BusinessSearchResponse;
  return data.businesses ?? [];
}

export async function updateBusinessJoin(
  business_id: number | null
): Promise<Record<string, unknown>> {
  const response = await authenticatedFetch(ENDPOINTS.BUSINESS_JOIN, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business_id }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to update join request"
    );
  }

  const data = (await response.json()) as { user: Record<string, unknown> };
  return data.user;
}

export async function leaveCompany(): Promise<Record<string, unknown>> {
  const response = await authenticatedFetch(ENDPOINTS.BUSINESS_LEAVE, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to leave company"
    );
  }

  const data = (await response.json()) as { user: Record<string, unknown> };
  return data.user;
}

export async function createBusiness(
  business_name: string
): Promise<Record<string, unknown>> {
  const response = await authenticatedFetch(ENDPOINTS.BUSINESS_CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business_name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to create company"
    );
  }

  const data = (await response.json()) as { user: Record<string, unknown> };
  return data.user;
}
