"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Play } from "lucide-react";
import { fetchBusinessConfig } from "@/lib/api/business-config-client";
import { startProspectDiscovery } from "@/lib/api/dashboard-client";
import type { BusinessConfigState } from "@/lib/types/business-config";
import { validateBusinessConfigForRun } from "@/lib/validation/business-config-readiness";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBar } from "@/components/ui/SkeletonBar";

export function StartProspectDiscoverModal({
  open,
  onClose,
  candidateCount: candidateCountOverride,
}: {
  open: boolean;
  onClose: () => void;
  candidateCount?: number;
}) {
  const [config, setConfig] = useState<BusinessConfigState | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setConfig(null);
      setError("");
      setSuccessMessage("");
      setSubmitting(false);
      return;
    }

    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchBusinessConfig();
        if (!cancelled) {
          setConfig(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load business configuration"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const readiness = config
    ? validateBusinessConfigForRun({
        ...config,
        number_of_candidates_per_run:
          candidateCountOverride ?? config.number_of_candidates_per_run,
      })
    : { ready: false, issues: [] };

  const candidateCount =
    candidateCountOverride ?? config?.number_of_candidates_per_run ?? 0;

  const handleConfirm = async () => {
    if (!readiness.ready || submitting || successMessage) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await startProspectDiscovery();
      setSuccessMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start discovery. Please try again later or contact your technical team."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Start Prospect Discover"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {successMessage ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              OK
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {!loading && !error && !readiness.ready ? (
                <Link
                  href="/configuration"
                  onClick={onClose}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                >
                  Go to Configuration
                </Link>
              ) : null}

              <button
                type="button"
                disabled={loading || Boolean(error) || !readiness.ready || submitting}
                onClick={() => void handleConfirm()}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {submitting ? "Starting..." : "Confirm"}
              </button>
            </>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <SkeletonBar className="h-4 w-full" />
          <SkeletonBar className="h-4 w-3/4" />
          <SkeletonBar className="h-20 w-full" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-900">
              Task sent successfully
            </p>
            <p className="mt-1 text-sm text-emerald-800">{successMessage}</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && config && !successMessage ? (
        <div className="space-y-5">
          {readiness.ready ? (
            <>
              <p className="text-sm leading-relaxed text-gray-700">
                This run will use your current{" "}
                <span className="font-medium text-gray-900">Configuration</span>{" "}
                settings — search criteria, scoring thresholds, contact
                preferences, outreach limits, and requirements.
              </p>

              <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
                <p className="text-sm text-violet-900">
                  This run will process{" "}
                  <span className="text-2xl font-bold">{candidateCount}</span>{" "}
                  candidate{candidateCount === 1 ? "" : "s"} based on your{" "}
                  <span className="font-medium">Candidates per Run</span>{" "}
                  setting.
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Click Confirm to start, or Cancel to go back.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Configuration incomplete
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Complete the required settings below before starting a run.
                    Use Go to Configuration to fill them in, or Cancel to close.
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {readiness.issues.map((issue) => (
                  <li
                    key={`${issue.section}-${issue.message}`}
                    className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {issue.section}
                      </p>
                      <p className="text-gray-600">{issue.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
