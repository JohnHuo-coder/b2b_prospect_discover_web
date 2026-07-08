"use client";

import { useEffect, useState } from "react";
import {
  fetchComplianceCheckRequirementFacts,
  type ComplianceCheckDetail,
} from "@/lib/api/human-review-client";
import type { ComplianceCheckEmailState } from "@/lib/compliance-check/review-payload";
import {
  formatEmailTextType,
  parseFactsItems,
  parseIssues,
} from "@/lib/human-review/format";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

function FactsList({ facts }: { facts: unknown }) {
  const items = parseFactsItems(facts);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No facts available.</p>;
  }

  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-800">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="[overflow-wrap:anywhere]">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ComplianceCheckReviewContent({
  detail,
  loading = false,
  error = null,
  onEmailStateChange,
}: {
  detail: ComplianceCheckDetail | null;
  loading?: boolean;
  error?: string | null;
  onEmailStateChange?: (state: ComplianceCheckEmailState) => void;
}) {
  const [selectedRequirement, setSelectedRequirement] = useState<"all" | number>(
    "all"
  );
  const [requirementFacts, setRequirementFacts] = useState<{
    req_ind: number;
    requirement: string;
    facts: unknown;
  } | null>(null);
  const [requirementLoading, setRequirementLoading] = useState(false);
  const [requirementError, setRequirementError] = useState<string | null>(null);
  const [originalOutreachEmail, setOriginalOutreachEmail] = useState("");
  const [outreachEmail, setOutreachEmail] = useState("");
  const [draftEmailText, setDraftEmailText] = useState("");
  const [emailModified, setEmailModified] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  useEffect(() => {
    setSelectedRequirement("all");
    setRequirementFacts(null);
    setRequirementError(null);
    setRequirementLoading(false);

    const initialEmail = detail?.email_text ?? "";
    setOriginalOutreachEmail(initialEmail);
    setOutreachEmail(initialEmail);
    setDraftEmailText(initialEmail);
    setEmailModified(false);
    setIsEditingEmail(false);
  }, [detail?.id, detail?.email_text]);

  useEffect(() => {
    onEmailStateChange?.({
      originalOutreachEmail,
      outreachEmail,
      emailModified,
      isEditingEmail,
    });
  }, [
    originalOutreachEmail,
    outreachEmail,
    emailModified,
    isEditingEmail,
    onEmailStateChange,
  ]);

  function handleStartEditEmail() {
    setDraftEmailText(outreachEmail);
    setIsEditingEmail(true);
  }

  function handleCancelEditEmail() {
    setDraftEmailText(outreachEmail);
    setIsEditingEmail(false);
  }

  function handleSaveEditEmail() {
    if (draftEmailText === outreachEmail) return;

    setOutreachEmail(draftEmailText);
    setEmailModified(draftEmailText !== originalOutreachEmail);
    setIsEditingEmail(false);
  }

  const canSaveEmailEdit =
    isEditingEmail && draftEmailText !== outreachEmail;

  useEffect(() => {
    if (!detail || selectedRequirement === "all") {
      setRequirementFacts(null);
      setRequirementError(null);
      setRequirementLoading(false);
      return;
    }

    let cancelled = false;

    const loadRequirementFacts = async () => {
      setRequirementLoading(true);
      setRequirementError(null);

      try {
        const result = await fetchComplianceCheckRequirementFacts(
          detail.id,
          selectedRequirement
        );
        if (!cancelled) {
          setRequirementFacts({
            req_ind: result.req_ind,
            requirement: result.requirement,
            facts: result.facts,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setRequirementFacts(null);
          setRequirementError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load requirement facts"
          );
        }
      } finally {
        if (!cancelled) setRequirementLoading(false);
      }
    };

    void loadRequirementFacts();

    return () => {
      cancelled = true;
    };
  }, [detail, selectedRequirement]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!detail && !loading) {
    return (
      <p className="text-sm text-gray-500">No compliance review data available.</p>
    );
  }

  const issues = detail ? parseIssues(detail.issues) : [];

  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Compliance review
        </h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading review details...</p>
        ) : detail ? (
          <dl className="space-y-4">
            <DetailField label="Email text type">
              {formatEmailTextType(detail.email_text_type)}
            </DetailField>
            <DetailField label="Reason">
              <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {detail.reason || "—"}
              </div>
            </DetailField>
            <DetailField label="Issues">
              {issues.length === 0 ? (
                <span className="text-gray-500">No issues listed.</span>
              ) : (
                <ul className="list-disc space-y-1.5 pl-5 [overflow-wrap:anywhere]">
                  {issues.map((issue, index) => (
                    <li key={`${issue}-${index}`}>{issue}</li>
                  ))}
                </ul>
              )}
            </DetailField>
            <div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Email text
                </dt>
                {!isEditingEmail ? (
                  <button
                    type="button"
                    onClick={handleStartEditEmail}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
              <dd className="mt-1 text-sm text-gray-800">
                {isEditingEmail ? (
                  <div className="space-y-3">
                    <textarea
                      value={draftEmailText}
                      onChange={(event) => setDraftEmailText(event.target.value)}
                      rows={8}
                      placeholder="Email text"
                      className="max-h-56 w-full resize-y rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 [overflow-wrap:anywhere]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEditEmail}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditEmail}
                        disabled={!canSaveEmailEdit}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-56 min-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-900 [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {outreachEmail || (
                      <span className="text-gray-400">No email text available.</span>
                    )}
                  </div>
                )}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">Company facts</h3>

        {detail && detail.facts.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRequirement("all")}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                selectedRequirement === "all"
                  ? "bg-violet-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              All requirements
            </button>
            {detail.facts.map((row) => {
              const active = selectedRequirement === row.req_ind;

              return (
                <button
                  key={row.req_ind}
                  type="button"
                  onClick={() => setSelectedRequirement(row.req_ind)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-violet-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Requirement {row.req_ind}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading facts...</p>
          ) : !detail || detail.facts.length === 0 ? (
            <p className="text-sm text-gray-500">No facts found for this company.</p>
          ) : selectedRequirement === "all" ? (
            <div className="space-y-3">
              {detail.facts.map((row) => (
                <div
                  key={row.req_ind}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    Requirement {row.req_ind}
                  </p>
                  {row.requirement ? (
                    <p className="mt-2 text-sm text-gray-600 [overflow-wrap:anywhere]">
                      {row.requirement}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <FactsList facts={row.facts} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {requirementLoading ? (
                <p className="text-sm text-gray-500">Loading requirement facts...</p>
              ) : requirementError ? (
                <p className="text-sm text-red-600">{requirementError}</p>
              ) : requirementFacts ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    Requirement {requirementFacts.req_ind}
                  </p>
                  {requirementFacts.requirement ? (
                    <p className="mt-2 text-sm text-gray-600 [overflow-wrap:anywhere]">
                      {requirementFacts.requirement}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <FactsList facts={requirementFacts.facts} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No facts available.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
