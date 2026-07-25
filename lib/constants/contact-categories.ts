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

export function toStoredContactCategory(value: string): string | null {
  const normalized = normalizeContactCategory(value);
  return normalized ? normalized.toLowerCase() : null;
}

export function toStoredContactCategories(values: string[]): string[] {
  const stored: string[] = [];

  for (const value of values) {
    const category = toStoredContactCategory(value);
    if (category && !stored.includes(category)) {
      stored.push(category);
    }
  }

  return stored;
}
