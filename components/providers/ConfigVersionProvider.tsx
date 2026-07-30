"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredConfigVersion,
  readStoredConfigVersion,
  writeStoredConfigVersion,
} from "@/lib/api/version-query";
import { useUser } from "@/components/providers/UserProvider";

type ConfigVersionContextValue = {
  currentVersion: number;
  selectedVersion: number;
  setSelectedVersion: (version: number) => void;
  isViewingHistoricalVersion: boolean;
  canSelectVersion: boolean;
};

const ConfigVersionContext = createContext<ConfigVersionContextValue | null>(
  null
);

function normalizeSelectedVersion(
  currentVersion: number,
  candidate: number | null
): number {
  if (currentVersion < 1) {
    return 0;
  }

  if (
    candidate !== null &&
    Number.isFinite(candidate) &&
    candidate >= 1 &&
    candidate <= currentVersion
  ) {
    return candidate;
  }

  return currentVersion;
}

export function ConfigVersionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const currentVersion = Number(user?.config_version) || 0;
  const [selectedVersion, setSelectedVersionState] = useState(() =>
    normalizeSelectedVersion(currentVersion, readStoredConfigVersion())
  );

  useEffect(() => {
    setSelectedVersionState((previous) => {
      const stored = readStoredConfigVersion();
      const preferred = stored ?? previous;
      return normalizeSelectedVersion(currentVersion, preferred);
    });
  }, [currentVersion]);

  const setSelectedVersion = useCallback(
    (version: number) => {
      const next = normalizeSelectedVersion(currentVersion, version);
      setSelectedVersionState(next);
      if (next > 0) {
        writeStoredConfigVersion(next);
      } else {
        clearStoredConfigVersion();
      }
    },
    [currentVersion]
  );

  const value = useMemo<ConfigVersionContextValue>(
    () => ({
      currentVersion,
      selectedVersion,
      setSelectedVersion,
      isViewingHistoricalVersion:
        currentVersion > 0 &&
        selectedVersion > 0 &&
        selectedVersion !== currentVersion,
      canSelectVersion: currentVersion > 0,
    }),
    [currentVersion, selectedVersion, setSelectedVersion]
  );

  return (
    <ConfigVersionContext.Provider value={value}>
      {children}
    </ConfigVersionContext.Provider>
  );
}

export function useConfigVersion(): ConfigVersionContextValue {
  const context = useContext(ConfigVersionContext);
  if (!context) {
    throw new Error("useConfigVersion must be used within ConfigVersionProvider");
  }
  return context;
}
