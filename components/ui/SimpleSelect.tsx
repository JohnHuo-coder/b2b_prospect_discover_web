"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SimpleSelectOption = {
  value: string;
  label: string;
};

export function SimpleSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  disabled = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SimpleSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", open && "dropdown-open", className)}
    >
      {label ? (
        <p className="mb-1.5 text-sm font-medium text-zinc-700">{label}</p>
      ) : null}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={cn(
          "flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-100",
          disabled
            ? "cursor-not-allowed bg-zinc-50 text-zinc-500"
            : "hover:border-zinc-300 focus:border-teal-300"
        )}
      >
        <span
          className={cn(
            "truncate",
            selectedOption ? "font-medium text-zinc-950" : "text-zinc-400"
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <li key={option.value || "__all__"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition",
                    selected
                      ? "bg-teal-50 font-medium text-teal-800"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-teal-800" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
