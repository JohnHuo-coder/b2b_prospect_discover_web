"use client";

import { FormLabelRow } from "@/components/ui/HelpTooltip";
import { NumberInput } from "@/components/ui/Modal";
import {
  DEFAULT_RUN_SETTINGS,
  formatDefaultRunSettingsHelp,
} from "@/lib/constants/config-defaults";

export function OutreachSettingsEditForm({
  minWords,
  maxWords,
  numberOfCandidatesPerRun,
  onMinWordsChange,
  onMaxWordsChange,
  onNumberOfCandidatesPerRunChange,
  onRestoreDefaults,
}: {
  minWords: number | null;
  maxWords: number | null;
  numberOfCandidatesPerRun: number | null;
  onMinWordsChange: (value: number | null) => void;
  onMaxWordsChange: (value: number | null) => void;
  onNumberOfCandidatesPerRunChange: (value: number | null) => void;
  onRestoreDefaults: () => void;
}) {
  return (
    <div className="space-y-4">
      <FormLabelRow
        label="Outreach Defaults"
        helpContent={formatDefaultRunSettingsHelp()}
        onRestoreDefaults={onRestoreDefaults}
      />

      <NumberInput
        label="Min. Words per Email"
        required
        min={1}
        value={minWords}
        onChange={onMinWordsChange}
      />
      <NumberInput
        label="Max. Words per Email"
        required
        min={1}
        value={maxWords}
        onChange={onMaxWordsChange}
      />
      <NumberInput
        label="Candidates per Run"
        required
        min={1}
        value={numberOfCandidatesPerRun}
        onChange={onNumberOfCandidatesPerRunChange}
      />
    </div>
  );
}

export function getDefaultRunSettingsDraft() {
  return { ...DEFAULT_RUN_SETTINGS };
}
