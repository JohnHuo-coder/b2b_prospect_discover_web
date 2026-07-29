import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type SuperadminCompany = {
  id: number | string;
  business_name: string | null;
  version: number | string | null;
  ownerFirebaseUid: string | null;
  owner_email: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
};

type SuperadminCompaniesResponse = {
  businesses: SuperadminCompany[];
};

export async function fetchSuperadminCompanies(): Promise<SuperadminCompany[]> {
  const response = await authenticatedFetch(ENDPOINTS.SUPERADMIN_COMPANIES);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to load companies"
    );
  }

  const data = (await response.json()) as SuperadminCompaniesResponse;
  return data.businesses ?? [];
}

export async function monitorSuperadminCompany(
  business_id: number
): Promise<Record<string, unknown>> {
  const response = await authenticatedFetch(
    ENDPOINTS.SUPERADMIN_COMPANIES_MONITOR,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to switch company context"
    );
  }

  const data = (await response.json()) as { user: Record<string, unknown> };
  return data.user;
}
