"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { RephraseSuggestion } from "@/lib/api/business-config-client";

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

  const updateRequirement = (index: number, value: string) => {
    onChange(requirements.map((item, i) => (i === index ? value : item)));
  };

  const removeRequirement = (index: number) => {
    onChange(requirements.filter((_, i) => i !== index));
    onDiscardRephraseSuggestion?.(index);
  };

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed) return;
    onChange([...requirements, trimmed]);
    setNewRequirement("");
  };

  return (
    <div>
      <div className="space-y-3">
        {requirements.map((requirement, index) => (
          <div key={`${index}-${requirement.slice(0, 20)}`} className="flex items-start gap-3">
            <span className="w-5 shrink-0 pt-2.5 text-sm font-medium text-gray-500">
              {index + 1}.
            </span>
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <textarea
                value={requirement}
                rows={2}
                onChange={(event) => updateRequirement(index, event.target.value)}
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                aria-label={`Remove requirement ${index + 1}`}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
          placeholder="Add a requirement..."
          onChange={(event) => setNewRequirement(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addRequirement();
            }
          }}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="button"
          onClick={addRequirement}
          className="shrink-0 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          + Add
        </button>
      </div>

      {hasPendingSuggestions ? (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">LLM Rephrase Suggestions</h3>
          </div>

          <div className="space-y-4">
            {requirements.map((requirement, index) => {
              const suggestion = rephraseSuggestions[index];
              if (!suggestion) return null;

              return (
                <div
                  key={`suggestion-${index}-${requirement.slice(0, 20)}`}
                  className="rounded-xl border border-violet-100 bg-violet-50/40 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                      Suggestion for #{index + 1}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onDiscardRephraseSuggestion?.(index)
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onKeepRephraseSuggestion?.(index, suggestion.clarified)
                        }
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
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
                    className="min-h-[44px] w-full resize-none rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />

                  {suggestion.reason ? (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
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
}: {
  onCancel: () => void;
  onSave: () => void;
  onRephrase: () => void;
  saving?: boolean;
  rephrasing?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <button
        type="button"
        onClick={onRephrase}
        disabled={saving || rephrasing}
        className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        {rephrasing ? "Rephrasing..." : "LLM Rephrase"}
      </button>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || rephrasing}
          className="text-sm font-medium text-gray-600 transition hover:text-gray-900 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || rephrasing}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
