export function formatEstimatedCost(value: number | null | undefined): string {
  const amount = Number(value) || 0;
  return `$${amount.toFixed(2)}`;
}

export function formatUsageLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatConfigLabel(_configId: string, version: number): string {
  return `v${version}`;
}
