import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type IndustryOption = {
  id: number;
  label: string;
};

export async function searchIndustries(
  search: string
): Promise<IndustryOption[]> {
  const query = search.trim();
  if (!query) {
    return [];
  }

  const params = new URLSearchParams({ search: query });
  const response = await authenticatedFetch(
    `${ENDPOINTS.BUSINESS_INDUSTRIES}?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to search industries"
    );
  }

  const data = (await response.json()) as { industries?: unknown };
  if (!Array.isArray(data.industries)) {
    return [];
  }

  return data.industries
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const record = item as Record<string, unknown>;
      const id = Number(record.id);
      const label = typeof record.label === "string" ? record.label.trim() : "";
      if (!Number.isInteger(id) || id < 1 || !label) return null;
      return { id, label };
    })
    .filter((item): item is IndustryOption => item !== null);
}
