"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  searchIndustries,
  type IndustryOption,
} from "@/lib/api/industry-client";
import type { SelectedIndustry } from "@/lib/constants/industries";
import { TARGET_PARTNER_INDUSTRY_HINT } from "@/lib/constants/target-partner";

type IndustryMultiSelectProps = {
  label: string;
  hint?: string;
  value: SelectedIndustry[];
  onChange: (value: SelectedIndustry[]) => void;
};

export function IndustryMultiSelect({
  label,
  hint = TARGET_PARTNER_INDUSTRY_HINT,
  value,
  onChange,
}: IndustryMultiSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<IndustryOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedIds = new Set(value.map((item) => item.id));

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setOptions([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const results = await searchIndustries(trimmed);
        if (!cancelled) {
          setOptions(
            results.filter((item) => !value.some((selected) => selected.id === item.id))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setOptions([]);
          setError(
            err instanceof Error ? err.message : "Failed to search industries"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const addIndustry = (option: IndustryOption) => {
    if (selectedIds.has(option.id)) {
      return;
    }

    onChange([...value, option]);
    setQuery("");
    setOpen(false);
    setError("");
  };

  const removeIndustry = (id: number) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>

      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
        {value.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2.5 py-1 text-sm text-violet-700"
          >
            {item.label}
            <button
              type="button"
              aria-label={`Remove ${item.label}`}
              onClick={() => removeIndustry(item.id)}
              className="rounded p-0.5 text-violet-500 transition hover:bg-violet-200 hover:text-violet-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={query}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          placeholder={value.length === 0 ? "Start typing to search industries..." : ""}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="min-w-[160px] flex-1 border-0 bg-transparent py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {showDropdown ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-gray-500">Searching...</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              No matching industries.
            </li>
          ) : (
            options.map((option) => (
              <li key={option.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addIndustry(option)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-900 transition hover:bg-violet-50"
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
