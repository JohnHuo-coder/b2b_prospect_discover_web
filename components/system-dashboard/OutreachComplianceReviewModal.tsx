"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  fetchComplianceCheckDetail,
  type ComplianceCheckDetail,
} from "@/lib/api/human-review-client";
import { submitOutreachComplianceDecision } from "@/lib/api/compliance-check-decision";
import {
  buildComplianceCheckDecisionPayload,
  type ComplianceCheckEmailState,
  type ComplianceCheckReviewAction,
} from "@/lib/compliance-check/review-payload";
import { ComplianceCheckReviewContent } from "@/components/human-review/ComplianceCheckReviewContent";

const initialEmailState: ComplianceCheckEmailState = {
  originalOutreachEmail: "",
  outreachEmail: "",
  emailModified: false,
  isEditingEmail: false,
};

export function OutreachComplianceReviewModal({
  open,
  candidateId,
  onClose,
  onComplete,
}: {
  open: boolean;
  candidateId: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [detail, setDetail] = useState<ComplianceCheckDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailState, setEmailState] =
    useState<ComplianceCheckEmailState>(initialEmailState);
  const [submitting, setSubmitting] = useState<ComplianceCheckReviewAction | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEmailStateChange = useCallback((state: ComplianceCheckEmailState) => {
    setEmailState(state);
  }, []);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setError(null);
      setLoading(false);
      setSubmitting(null);
      setActionError(null);
      setEmailState(initialEmailState);
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchComplianceCheckDetail(candidateId);
        if (!cancelled) setDetail(result);
      } catch (loadError) {
        if (!cancelled) {
          setDetail(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load compliance review"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, candidateId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const actionsDisabled = Boolean(submitting) || emailState.isEditingEmail;

  async function handleAction(action: ComplianceCheckReviewAction) {
    if (!detail || emailState.isEditingEmail) return;

    setSubmitting(action);
    setActionError(null);

    try {
      await submitOutreachComplianceDecision(
        candidateId,
        buildComplianceCheckDecisionPayload(detail, emailState, action)
      );
      onComplete?.();
      onClose();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save review decision"
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close compliance review"
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-review-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="compliance-review-title"
            className="text-base font-semibold text-gray-900"
          >
            Compliance review
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(submitting)}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <ComplianceCheckReviewContent
            detail={detail}
            loading={loading}
            error={error}
            onEmailStateChange={handleEmailStateChange}
          />
        </div>

        {detail && !loading && !error ? (
          <div className="border-t border-gray-100 px-6 py-4">
            {emailState.isEditingEmail ? (
              <p className="mb-3 text-sm text-amber-700">
                Save or cancel your email edits before approving or discarding.
              </p>
            ) : null}
            {actionError ? (
              <p className="mb-3 text-sm text-red-600">{actionError}</p>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => void handleAction("discard")}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting === "discard" ? "Discarding..." : "Discard"}
              </button>
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => void handleAction("keep")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting === "keep" ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
