function extractStartDiscoveryRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  if (typeof record.status === "string") {
    return record;
  }

  if (record.result && typeof record.result === "object") {
    return extractStartDiscoveryRecord(record.result);
  }

  if (record.data && typeof record.data === "object") {
    return extractStartDiscoveryRecord(record.data);
  }

  return null;
}

export function parseStartDiscoveryResponse(data: unknown): {
  accepted: boolean;
  message: string;
} {
  const record = extractStartDiscoveryRecord(data);
  const status =
    typeof record?.status === "string" ? record.status.trim().toLowerCase() : "";
  const message =
    typeof record?.message === "string" && record.message.trim()
      ? record.message.trim()
      : "Discovery workflow started.";

  if (status === "accepted") {
    return { accepted: true, message };
  }

  if (!record) {
    return { accepted: true, message };
  }

  return { accepted: false, message };
}
