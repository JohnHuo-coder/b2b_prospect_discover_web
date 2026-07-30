"use client";

import { ConfigVersionSelect } from "@/components/dashboard/ConfigVersionSelect";
import { useConfigVersion } from "@/components/providers/ConfigVersionProvider";

export function ConfigVersionToolbar({
  className = "",
}: {
  className?: string;
}) {
  const {
    currentVersion,
    selectedVersion,
    setSelectedVersion,
    isViewingHistoricalVersion,
    canSelectVersion,
  } = useConfigVersion();

  if (!canSelectVersion) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <ConfigVersionSelect
        currentVersion={currentVersion}
        selectedVersion={selectedVersion}
        onChange={setSelectedVersion}
      />
      {isViewingHistoricalVersion ? (
        <p className="text-sm text-teal-800">
          Viewing v{selectedVersion} snapshot. Current version is v{currentVersion}.
        </p>
      ) : null}
    </div>
  );
}
