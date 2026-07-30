"use client";

import { SimpleSelect } from "@/components/ui/SimpleSelect";

type ConfigVersionSelectProps = {
  currentVersion: number;
  selectedVersion: number;
  onChange: (version: number) => void;
  disabled?: boolean;
};

export function ConfigVersionSelect({
  currentVersion,
  selectedVersion,
  onChange,
  disabled = false,
}: ConfigVersionSelectProps) {
  if (currentVersion < 1) {
    return null;
  }

  const versions = Array.from({ length: currentVersion }, (_, index) => index + 1);

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Version</span>
      <SimpleSelect
        value={String(selectedVersion)}
        onChange={(value) => onChange(Number(value))}
        disabled={disabled}
        options={versions.map((version) => ({
          value: String(version),
          label: `v${version}`,
        }))}
        className="w-[84px]"
      />
    </div>
  );
}
