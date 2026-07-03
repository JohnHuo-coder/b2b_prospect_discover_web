export function parseDisplayName(displayName: string | undefined | null): {
  first_name: string | null;
  last_name: string | null;
} {
  const trimmed = displayName?.trim();
  if (!trimmed) {
    return { first_name: null, last_name: null };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: null };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function normalizeOptionalName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}
