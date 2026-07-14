"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import {
  type ComplianceCheckDetail,
  type ComplianceCheckReviewAction,
} from "@/lib/api/human-review-client";
import { submitHumanReviewComplianceDecision } from "@/lib/api/compliance-check-decision";
import {
  buildComplianceCheckDecisionPayload,
  type ComplianceCheckEmailState,
} from "@/lib/compliance-check/review-payload";
import { ComplianceCheckReviewContent } from "./ComplianceCheckReviewContent";

const initialEmailState: ComplianceCheckEmailState = {
  originalOutreachEmail: "",
  outreachEmail: "",
  emailModified: false,
  isEditingEmail: false,
};

export function ComplianceCheckDetailPanel({
  detail,
  loading = false,
  error = null,
  onClose,
  onDecisionComplete,
}: {
  detail: ComplianceCheckDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onDecisionComplete?: () => void;
}) {
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
    if (!detail) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detail, onClose, submitting]);

  useEffect(() => {
    setActionError(null);
    setSubmitting(null);
    setEmailState(initialEmailState);
  }, [detail?.id]);

  async function handleAction(action: ComplianceCheckReviewAction) {
    if (!detail || emailState.isEditingEmail) return;

    setSubmitting(action);
    setActionError(null);

    try {
      await submitHumanReviewComplianceDecision(
        detail.id,
        buildComplianceCheckDecisionPayload(detail, emailState, action)
      );
      onDecisionComplete?.();
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

  if (!detail) return null;

  const showActions = !loading && !error;
  const actionsDisabled = Boolean(submitting) || emailState.isEditingEmail;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close detail panel"
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-check-detail-title"
        className="relative z-10 flex h-full w-full max-w-3xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {detail.id}
            </p>
            <h2
              id="compliance-check-detail-title"
              className="mt-1 text-lg font-semibold text-gray-900"
            >
              {detail.company}
            </h2>
            {detail.website ? (
              <a
                href={
                  detail.website.startsWith("http")
                    ? detail.website
                    : `https://${detail.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
              >
                {detail.website}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(submitting)}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ComplianceCheckReviewContent
            detail={detail}
            loading={loading}
            error={error}
            onEmailStateChange={handleEmailStateChange}
          />
        </div>

        {showActions ? (
          <div className="border-t border-gray-100 px-6 py-4">
            {emailState.isEditingEmail ? (
              <p className="mb-3 text-sm text-amber-700">
                Save or cancel your email edits before keeping or discarding.
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
                {submitting === "keep" ? "Sending..." : "Keep and Send"}
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
