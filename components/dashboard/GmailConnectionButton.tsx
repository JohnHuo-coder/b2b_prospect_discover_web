"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import {
  fetchGmailStatus,
  startGmailConnect,
  type GmailConnectionStatus,
} from "@/lib/api/gmail-client";

export function GmailConnectionButton() {
  const [status, setStatus] = useState<GmailConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await fetchGmailStatus();
        if (!cancelled) {
          setStatus(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Gmail status");
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-500">
        <Mail className="h-4 w-4" />
        Checking Gmail...
      </span>
    );
  }

  if (status?.connected && status.email) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
        <Mail className="h-4 w-4" />
        Gmail: {status.email}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setConnecting(true);
          setError("");
          void startGmailConnect({ returnTo: "/dashboard" }).catch((err) => {
            setConnecting(false);
            setError(
              err instanceof Error ? err.message : "Failed to start Gmail connection"
            );
          });
        }}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mail className="h-4 w-4" />
        {connecting ? "Connecting..." : "Connect to Gmail"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

export function useGmailStatus() {
  const [status, setStatus] = useState<GmailConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchGmailStatus();
      setStatus(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Gmail status");
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { status, loading, error, refresh };
}
