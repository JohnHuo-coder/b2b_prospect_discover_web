"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { FormLabelRow } from "@/components/ui/HelpTooltip";

export function TagInput({
  label,
  hint,
  tags,
  onChange,
  placeholder = "Type and press Enter...",
  required = false,
  helpContent,
  onRestoreDefaults,
}: {
  label: string;
  hint?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  required?: boolean;
  helpContent?: ReactNode;
  onRestoreDefaults?: () => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const exists = tags.some(
      (tag) => tag.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setInputValue("");
      return;
    }

    onChange([...tags, trimmed]);
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(inputValue);
      return;
    }

    if (event.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <label className="block">
      <FormLabelRow
        label={label}
        required={required}
        helpContent={helpContent}
        onRestoreDefaults={onRestoreDefaults}
      />
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-sm text-gray-700"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(index)}
              className="rounded p-0.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          placeholder={tags.length === 0 ? placeholder : ""}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
    </label>
  );
}
