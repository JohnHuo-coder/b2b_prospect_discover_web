"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchBusinessConfig,
  updateCandidatesPerRun,
} from "@/lib/api/business-config-client";
import { DEFAULT_RUN_SETTINGS } from "@/lib/constants/config-defaults";

type CandidatesPerRunControlProps = {
  disabled?: boolean;
  onValueChange?: (value: number) => void;
};

export function CandidatesPerRunControl({
  disabled = false,
  onValueChange,
}: CandidatesPerRunControlProps) {
  const [value, setValue] = useState<number>(
    DEFAULT_RUN_SETTINGS.number_of_candidates_per_run
  );
  const [savedValue, setSavedValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const config = await fetchBusinessConfig();
        if (cancelled) return;

        const loaded =
          config.number_of_candidates_per_run ??
          DEFAULT_RUN_SETTINGS.number_of_candidates_per_run;
        setValue(loaded);
        setSavedValue(loaded);
        onValueChangeRef.current?.(loaded);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load candidates per run"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [disabled]);

  const isDirty = savedValue !== null && value !== savedValue;

  const handleSave = useCallback(async () => {
    if (disabled || loading || saving || savedValue === null || !isDirty) {
      return;
    }
    if (!Number.isInteger(value) || value < 1) {
      setError("Candidates per run must be a positive integer");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved = await updateCandidatesPerRun(value);
      setSavedValue(saved);
      setValue(saved);
      onValueChangeRef.current?.(saved);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update candidates per run"
      );
    } finally {
      setSaving(false);
    }
  }, [disabled, isDirty, loading, savedValue, saving, value]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="whitespace-nowrap font-medium">Candidates per run</span>
          <input
            type="number"
            min={1}
            step={1}
            disabled={disabled || loading || saving}
            value={value}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isInteger(parsed) || parsed < 1) {
                return;
              }
              setValue(parsed);
              setError("");
            }}
            className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
        </label>
        <button
          type="button"
          disabled={disabled || loading || saving || !isDirty}
          onClick={() => void handleSave()}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {error ? (
        <span className="max-w-xs text-right text-xs text-red-600">{error}</span>
      ) : null}
    </div>
  );
}
