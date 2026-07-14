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
  onMinWordsChange,
  onMaxWordsChange,
  onRestoreDefaults,
}: {
  minWords: number | null;
  maxWords: number | null;
  onMinWordsChange: (value: number | null) => void;
  onMaxWordsChange: (value: number | null) => void;
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
    </div>
  );
}

export function getDefaultRunSettingsDraft() {
  return {
    min_words: DEFAULT_RUN_SETTINGS.min_words,
    max_words: DEFAULT_RUN_SETTINGS.max_words,
  };
}
