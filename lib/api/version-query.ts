const STORAGE_KEY = "prospect-discover:selected-config-version";

export function appendVersionQuery(url: string, version?: number): string {
  if (version === undefined || version <= 0) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}version=${encodeURIComponent(String(version))}`;
}

export function readStoredConfigVersion(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function writeStoredConfigVersion(version: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, String(version));
}

export function clearStoredConfigVersion(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}
