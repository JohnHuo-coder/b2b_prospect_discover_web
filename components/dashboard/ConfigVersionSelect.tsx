"use client";

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
    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
      <span className="font-medium text-gray-700">Version</span>
      <select
        value={selectedVersion}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
      >
        {versions.map((version) => (
          <option key={version} value={version}>
            {version}
            {version === currentVersion ? " (current)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
