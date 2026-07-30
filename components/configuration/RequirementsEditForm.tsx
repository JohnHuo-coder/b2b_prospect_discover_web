"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { RephraseSuggestion } from "@/lib/api/business-config-client";
import {
  MAX_REQUIREMENTS,
  REQUIREMENT_INPUT_PLACEHOLDER,
  REQUIREMENTS_TESTING_NOTICE,
} from "@/lib/constants/requirements";

export function RequirementsEditForm({
  requirements,
  onChange,
  rephraseSuggestions = [],
  onUpdateRephraseSuggestion,
  onKeepRephraseSuggestion,
  onDiscardRephraseSuggestion,
}: {
  requirements: string[];
  onChange: (requirements: string[]) => void;
  rephraseSuggestions?: Array<RephraseSuggestion | null>;
  onUpdateRephraseSuggestion?: (index: number, clarified: string) => void;
  onKeepRephraseSuggestion?: (index: number, clarified: string) => void;
  onDiscardRephraseSuggestion?: (index: number) => void;
}) {
  const [newRequirement, setNewRequirement] = useState("");
  const hasPendingSuggestions = rephraseSuggestions.some(Boolean);
  const atRequirementLimit = requirements.length >= MAX_REQUIREMENTS;

  const updateRequirement = (index: number, value: string) => {
    onChange(requirements.map((item, i) => (i === index ? value : item)));
  };

  const removeRequirement = (index: number) => {
    onChange(requirements.filter((_, i) => i !== index));
    onDiscardRephraseSuggestion?.(index);
  };

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed || atRequirementLimit) return;
    onChange([...requirements, trimmed]);
    setNewRequirement("");
  };

  return (
    <div>
      <p className="mb-4 text-xs leading-relaxed text-zinc-500">
        {REQUIREMENTS_TESTING_NOTICE}
      </p>

      <div className="space-y-3">
        {requirements.map((requirement, index) => (
          <div key={`${index}-${requirement.slice(0, 20)}`} className="flex items-start gap-3">
            <span className="w-5 shrink-0 pt-2.5 text-sm font-medium text-zinc-500">
              {index + 1}.
            </span>
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <textarea
                value={requirement}
                rows={2}
                onChange={(event) => updateRequirement(index, event.target.value)}
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm leading-relaxed text-zinc-800 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                aria-label={`Remove requirement ${index + 1}`}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newRequirement}
          placeholder={
            atRequirementLimit
              ? `Maximum of ${MAX_REQUIREMENTS} requirements reached`
              : REQUIREMENT_INPUT_PLACEHOLDER
          }
          disabled={atRequirementLimit}
          onChange={(event) => setNewRequirement(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addRequirement();
            }
          }}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
        />
        <button
          type="button"
          onClick={addRequirement}
          disabled={atRequirementLimit}
          className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
        >
          + Add
        </button>
      </div>

      {hasPendingSuggestions ? (
        <div className="mt-8 border-t border-zinc-100 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-zinc-950">LLM Rephrase Suggestions</h3>
          </div>

          <div className="space-y-4">
            {requirements.map((requirement, index) => {
              const suggestion = rephraseSuggestions[index];
              if (!suggestion) return null;

              return (
                <div
                  key={`suggestion-${index}-${requirement.slice(0, 20)}`}
                  className="rounded-xl border border-teal-100 bg-teal-50/40 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                      Suggestion for #{index + 1}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onDiscardRephraseSuggestion?.(index)
                        }
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onKeepRephraseSuggestion?.(index, suggestion.clarified)
                        }
                        className="rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-900"
                      >
                        Keep
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={suggestion.clarified}
                    rows={2}
                    onChange={(event) =>
                      onUpdateRephraseSuggestion?.(index, event.target.value)
                    }
                    className="min-h-[44px] w-full resize-none rounded-lg border border-teal-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-800 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                  />

                  {suggestion.reason ? (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      {suggestion.reason}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RequirementsModalFooter({
  onCancel,
  onSave,
  onRephrase,
  saving = false,
  rephrasing = false,
  rephraseError = null,
  hideCancel = false,
  hideSave = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  onRephrase: () => void;
  saving?: boolean;
  rephrasing?: boolean;
  rephraseError?: string | null;
  hideCancel?: boolean;
  hideSave?: boolean;
}) {
  return (
    <div>
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onRephrase}
          disabled={saving || rephrasing}
          className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {rephrasing ? "Rephrasing..." : "LLM Rephrase"}
        </button>

        {!hideCancel || !hideSave ? (
          <div className="flex items-center gap-4">
            {!hideCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={saving || rephrasing}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950 disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
            {!hideSave ? (
              <button
                type="button"
                onClick={onSave}
                disabled={saving || rephrasing}
                className="rounded-lg bg-teal-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {rephraseError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {rephraseError}
        </div>
      ) : null}
    </div>
  );
}
