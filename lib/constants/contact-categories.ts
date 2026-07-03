export const CONTACT_CATEGORY_OPTIONS = [
  "Buyer",
  "CEO",
  "Engineering",
  "Finance",
  "HR",
  "IT",
  "Logistics",
  "Marketing",
  "Operations",
  "Sales",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORY_OPTIONS)[number];

export function normalizeContactCategory(value: string): ContactCategory | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  return (
    CONTACT_CATEGORY_OPTIONS.find(
      (option) => option.toLowerCase() === trimmed.toLowerCase()
    ) ?? null
  );
}

export function normalizeContactCategories(values: string[]): ContactCategory[] {
  const normalized: ContactCategory[] = [];

  for (const value of values) {
    const category = normalizeContactCategory(value);
    if (category && !normalized.includes(category)) {
      normalized.push(category);
    }
  }

  return normalized;
}
