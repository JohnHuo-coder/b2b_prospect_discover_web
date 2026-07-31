"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function AuthPasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  hint,
  labelExtra,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: "new-password" | "current-password";
  required?: boolean;
  hint?: string;
  labelExtra?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </span>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-zinc-200 py-2.5 pl-3 pr-10 text-sm text-zinc-950 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 transition hover:text-zinc-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </label>
  );
}
