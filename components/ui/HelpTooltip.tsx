"use client";

import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export function HelpTooltip({ content }: { content: ReactNode }) {
  return (
    <span className="group relative inline-flex align-middle">
      <HelpCircle
        className="h-3.5 w-3.5 cursor-help text-gray-400 transition hover:text-gray-600"
        aria-hidden
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 hidden w-max max-w-xs whitespace-pre-line rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg group-hover:block"
      >
        {content}
      </span>
    </span>
  );
}

export function FormLabelRow({
  label,
  required = false,
  helpContent,
  onRestoreDefaults,
  restoreLabel = "Restore defaults",
}: {
  label: string;
  required?: boolean;
  helpContent?: ReactNode;
  onRestoreDefaults?: () => void;
  restoreLabel?: string;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {helpContent ? <HelpTooltip content={helpContent} /> : null}
      {onRestoreDefaults ? (
        <button
          type="button"
          onClick={onRestoreDefaults}
          className="text-xs font-medium text-violet-600 transition hover:text-violet-700 hover:underline"
        >
          {restoreLabel}
        </button>
      ) : null}
    </div>
  );
}
