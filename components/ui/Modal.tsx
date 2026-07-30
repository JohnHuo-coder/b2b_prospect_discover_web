"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { FormLabelRow } from "@/components/ui/HelpTooltip";

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "default",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "default" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex max-h-[90vh] w-full flex-col rounded-xl border border-zinc-200/90 bg-white/95 shadow-[0_28px_60px_-24px_rgba(24,24,27,0.18)] backdrop-blur-sm ${
          size === "xl"
            ? "max-w-4xl"
            : size === "lg"
              ? "max-w-2xl"
              : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-zinc-950">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-t border-zinc-100 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalActions({
  onCancel,
  onSave,
  saving = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  hint,
  helpContent,
  onRestoreDefaults,
  disabled = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  hint?: string;
  helpContent?: ReactNode;
  onRestoreDefaults?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const locked = disabled || readOnly;

  return (
    <label className="block">
      <FormLabelRow
        label={label}
        required={required}
        helpContent={helpContent}
        onRestoreDefaults={onRestoreDefaults}
      />
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100 ${
          locked ? "cursor-not-allowed bg-zinc-50 text-zinc-600" : ""
        }`}
      />
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
  helpContent,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
  helpContent?: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FormLabelRow
        label={label}
        required={required}
        helpContent={helpContent}
      />
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
      />
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </label>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  required = false,
  min,
  max,
  hint,
  helpContent,
  onRestoreDefaults,
  disabled = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
  min?: number;
  max?: number;
  hint?: string;
  helpContent?: ReactNode;
  onRestoreDefaults?: () => void;
  disabled?: boolean;
}) {
  return (
    <TextInput
      label={label}
      required={required}
      type="number"
      min={min}
      max={max}
      hint={hint}
      helpContent={helpContent}
      onRestoreDefaults={onRestoreDefaults}
      disabled={disabled}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(next) => {
        const trimmed = next.trim();
        if (!trimmed) {
          onChange(null);
          return;
        }
        const numeric = Number(trimmed);
        onChange(Number.isNaN(numeric) ? null : numeric);
      }}
    />
  );
}

export function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-teal-800 focus:ring-teal-600"
      />
      {label}
    </label>
  );
}

export function SwitchInput({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-100 focus:ring-offset-2 ${
          checked ? "bg-teal-800" : "bg-zinc-200"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function listToLines(items: string[]) {
  return items.join("\n");
}
