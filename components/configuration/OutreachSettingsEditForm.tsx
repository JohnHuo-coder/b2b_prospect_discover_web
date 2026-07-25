"use client";

import { FormLabelRow } from "@/components/ui/HelpTooltip";
import { NumberInput, TextInput } from "@/components/ui/Modal";
import {
  buildDefaultSubjectLine,
  DEFAULT_RUN_SETTINGS,
  formatDefaultRunSettingsHelp,
} from "@/lib/constants/config-defaults";

export function OutreachSettingsEditForm({
  businessName,
  subjectLine,
  minWords,
  maxWords,
  onSubjectLineChange,
  onMinWordsChange,
  onMaxWordsChange,
  onRestoreDefaults,
}: {
  businessName: string;
  subjectLine: string;
  minWords: number | null;
  maxWords: number | null;
  onSubjectLineChange: (value: string) => void;
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

      <TextInput
        label="Email Subject Line"
        required
        value={subjectLine}
        onChange={onSubjectLineChange}
        placeholder={buildDefaultSubjectLine(businessName)}
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

export function getDefaultOutreachSettingsDraft(businessName: string) {
  return {
    subject_line: buildDefaultSubjectLine(businessName),
    min_words: DEFAULT_RUN_SETTINGS.min_words,
    max_words: DEFAULT_RUN_SETTINGS.max_words,
  };
}
