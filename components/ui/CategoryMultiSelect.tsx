"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { FormLabelRow } from "@/components/ui/HelpTooltip";
import {
  CONTACT_CATEGORY_OPTIONS,
  type ContactCategory,
} from "@/lib/constants/contact-categories";

export function CategoryMultiSelect({
  label,
  hint,
  value,
  onChange,
  required = false,
  helpContent,
  onRestoreDefaults,
}: {
  label: string;
  hint?: string;
  value: ContactCategory[];
  onChange: (value: ContactCategory[]) => void;
  required?: boolean;
  helpContent?: ReactNode;
  onRestoreDefaults?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const toggleCategory = (category: ContactCategory) => {
    if (value.includes(category)) {
      onChange(value.filter((item) => item !== category));
      return;
    }

    onChange([...value, category]);
  };

  const removeCategory = (category: ContactCategory) => {
    onChange(value.filter((item) => item !== category));
  };

  return (
    <div ref={containerRef} className="relative block">
      <FormLabelRow
        label={label}
        required={required}
        helpContent={helpContent}
        onRestoreDefaults={onRestoreDefaults}
      />
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left transition hover:border-zinc-300 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {value.length === 0 ? (
            <span className="text-sm text-zinc-400">Select categories...</span>
          ) : (
            value.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2.5 py-1 text-sm text-teal-800"
                onClick={(event) => event.stopPropagation()}
              >
                {category}
                <button
                  type="button"
                  aria-label={`Remove ${category}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeCategory(category);
                  }}
                  className="rounded p-0.5 text-teal-600 transition hover:bg-teal-200 hover:text-teal-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open ? (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {CONTACT_CATEGORY_OPTIONS.map((category) => {
            const selected = value.includes(category);

            return (
              <li key={category}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggleCategory(category)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition ${
                    selected
                      ? "bg-teal-50 text-teal-800"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span>{category}</span>
                  {selected ? <Check className="h-4 w-4 text-teal-800" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
