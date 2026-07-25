"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  sendOutreachEmail,
  updateOutreachEmail,
  type LeadContact,
  type OutreachEmailStatus,
} from "@/lib/api/lead-detail-client";
import { startGmailConnect } from "@/lib/api/gmail-client";
import type { GmailConnectionStatus } from "@/lib/api/gmail-client";

type OutreachEmailModalProps = {
  open: boolean;
  leadId: string;
  configVersion?: number;
  contact: LeadContact | null;
  gmailStatus: GmailConnectionStatus | null;
  gmailLoading?: boolean;
  onClose: () => void;
  onUpdated: (contactEmail: string, updates: Partial<LeadContact>) => void;
  autoSend?: boolean;
};

export function OutreachEmailModal({
  open,
  leadId,
  configVersion,
  contact,
  gmailStatus,
  gmailLoading = false,
  onClose,
  onUpdated,
  autoSend = false,
}: OutreachEmailModalProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [error, setError] = useState("");
  const [autoSendAttempted, setAutoSendAttempted] = useState(false);
  const [confirmMarkReadyOpen, setConfirmMarkReadyOpen] = useState(false);

  const isReady = contact?.outreachStatus === "ready";
  const isSent = contact?.outreachStatus === "sent";
  const isBusy = saving || sending || reopening;
  const canEdit = isReady && !isBusy;
  const canCopy = Boolean(contact?.outreachEmail || draft);
  const isDirty = isReady && draft !== contact?.outreachEmail;

  useEffect(() => {
    if (!open || !contact) return;
    setDraft(contact.outreachEmail);
    setError("");
    setCopyMessage("");
    setAutoSendAttempted(false);
  }, [open, contact]);

  const handleSend = useCallback(async () => {
    if (!contact || contact.outreachStatus !== "ready" || saving || sending || reopening) {
      return;
    }

    if (!gmailStatus?.connected) {
      startGmailConnect({
        returnTo: `/leads/${leadId}`,
        leadId,
        contactEmail: contact.email,
        autoSend: true,
      });
      return;
    }

    setSending(true);
    setError("");

    try {
      const result = await sendOutreachEmail(
        leadId,
        {
          email: contact.email,
          outreach_email: draft,
        },
        configVersion
      );

      onUpdated(contact.email, {
        outreachEmail: result.outreach_email,
        outreachStatus: result.status,
      });
      setDraft(result.outreach_email);
    } catch (err) {
      const sendError = err as Error & { status?: number };
      if (sendError.status === 403) {
        startGmailConnect({
          returnTo: `/leads/${leadId}`,
          leadId,
          contactEmail: contact.email,
          autoSend: true,
        });
        return;
      }
      setError(sendError.message || "Failed to send outreach email");
    } finally {
      setSending(false);
    }
  }, [
    contact,
    configVersion,
    draft,
    gmailStatus?.connected,
    leadId,
    onUpdated,
    reopening,
    saving,
    sending,
  ]);

  useEffect(() => {
    if (!open || !contact || !autoSend || autoSendAttempted || isBusy || gmailLoading) {
      return;
    }

    setAutoSendAttempted(true);
    void handleSend();
  }, [
    open,
    contact,
    autoSend,
    autoSendAttempted,
    isBusy,
    gmailLoading,
    handleSend,
  ]);

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleCancel = () => {
    if (!contact || isBusy) return;
    setDraft(contact.outreachEmail);
    setError("");
    onClose();
  };

  const handleSave = async () => {
    if (!contact || !canEdit || !isDirty) return;

    setSaving(true);
    setError("");

    try {
      const result = await updateOutreachEmail(
        leadId,
        {
          email: contact.email,
          outreach_email: draft,
        },
        configVersion
      );

      onUpdated(contact.email, {
        outreachEmail: result.outreach_email,
        outreachStatus: "ready",
      });
      setCopyMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save outreach email");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = async () => {
    if (!contact || !isSent || isBusy) return;

    setConfirmMarkReadyOpen(false);
    setReopening(true);
    setError("");

    try {
      const result = await updateOutreachEmail(
        leadId,
        {
          email: contact.email,
          status: "ready",
        },
        configVersion
      );

      onUpdated(contact.email, {
        outreachStatus: (result.status as OutreachEmailStatus) ?? "ready",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark outreach email as ready"
      );
    } finally {
      setReopening(false);
    }
  };

  const handleCopy = async () => {
    const content = canEdit ? draft : contact?.outreachEmail || draft;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopyMessage("Copied to clipboard");
    } catch {
      setCopyMessage("Unable to copy automatically");
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <>
    <Modal
      open={open}
      title="Outreach Email"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {canCopy ? (
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            ) : null}
            {isSent ? (
              <button
                type="button"
                onClick={() => setConfirmMarkReadyOpen(true)}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                {reopening ? "Updating..." : "Mark as ready"}
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isReady ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isBusy}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isBusy || !isDirty}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isBusy}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                disabled={isBusy}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-500">To: {contact.email}</p>
          {contact.outreachStatus ? (
            <StatusBadge status={contact.outreachStatus} />
          ) : null}
        </div>

        {canEdit ? (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={14}
            disabled={isBusy}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
        ) : (
          <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
            {contact.outreachEmail}
          </pre>
        )}

        {copyMessage ? <p className="text-sm text-emerald-600">{copyMessage}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {sending ? (
          <p className="text-sm text-gray-500">
            Sending via Gmail. Please wait and do not edit the email.
          </p>
        ) : null}
      </div>
    </Modal>

    <Modal
      open={confirmMarkReadyOpen}
      title="Mark as ready?"
      onClose={() => {
        if (reopening) return;
        setConfirmMarkReadyOpen(false);
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmMarkReadyOpen(false)}
            disabled={reopening}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleMarkReady()}
            disabled={reopening}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reopening ? "Updating..." : "Mark as ready"}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-gray-700">
        This will change the outreach status back to <strong>ready</strong>. To mark
        it as <strong>sent</strong> again, you will need to send the email through
        Gmail one more time.
      </p>
    </Modal>
    </>
  );
}
