export function formatEstimatedCost(value: number | null | undefined): string {
  const amount = Number(value) || 0;
  if (amount >= 1) {
    return `$${amount.toFixed(2)}`;
  }
  if (amount >= 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(6)}`;
}

export function formatUsageLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatConfigLabel(configId: string, version: number): string {
  return `Config v${version} (#${configId})`;
}
