export function parseIssues(issues: unknown): string[] {
  if (!issues) return [];

  if (Array.isArray(issues)) {
    return issues.map(String).filter(Boolean);
  }

  if (typeof issues === "string") {
    const trimmed = issues.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      // fall through
    }

    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [String(issues)];
}

export function parseFactsItems(value: unknown): string[] {
  if (value == null || value === "") return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      return normalizeFactsItems(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  return normalizeFactsItems(value);
}

function normalizeFactsItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item == null) return "";
        return String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "object" && value !== null) {
    const values = Object.values(value as Record<string, unknown>);
    if (values.length > 0) {
      return values.flatMap((item) => normalizeFactsItems(item));
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [String(value)];
}

export function formatEmailTextType(type: string): string {
  const normalized = type.trim().toLowerCase().replace(/_/g, " ");
  if (normalized === "body") return "Body";
  if (normalized === "full email") return "Full email";
  return type || "—";
}
