"use client";

import {
  BarChart3,
  Building2,
  List,
  Mail,
  MapPin,
  Target,
  Users,
} from "lucide-react";
import type { BusinessConfigState } from "@/lib/types/business-config";
import type { RephraseSuggestion } from "@/lib/api/business-config-client";
import { BUSINESS_NAME_IMMUTABLE_HINT, COLLABORATION_INTENT_HELP, COLLABORATION_INTENT_PLACEHOLDER } from "@/lib/constants/business-identity";
import { ConfigCard } from "@/components/ui/ConfigCard";
import {
  RequirementsEditForm,
  RequirementsModalFooter,
} from "@/components/configuration/RequirementsEditForm";
import { ContactPreferencesEditForm } from "@/components/configuration/ContactPreferencesEditForm";
import { IndustryMultiSelect } from "@/components/configuration/IndustryMultiSelect";
import {
  getDefaultOutreachSettingsDraft,
  OutreachSettingsEditForm,
} from "@/components/configuration/OutreachSettingsEditForm";
import {
  linesToList,
  listToLines,
  NumberInput,
  SwitchInput,
  TextArea,
  TextInput,
} from "@/components/ui/Modal";
import {
  MAX_REQUIREMENTS,
  REQUIREMENT_INPUT_PLACEHOLDER,
  REQUIREMENTS_HELP,
} from "@/lib/constants/requirements";
import {
  TARGET_PARTNER_INDUSTRY_HINT,
  TARGET_PARTNER_SEARCH_KEYWORD_HELP,
  TARGET_PARTNER_SEARCH_KEYWORD_PLACEHOLDER,
  TARGET_PARTNER_SEARCH_LOCATION_HELP,
  TARGET_PARTNER_SEARCH_LOCATION_PLACEHOLDER,
} from "@/lib/constants/target-partner";
import {
  DISTANCE_REQUIREMENT_HINT,
  COMPANY_LATITUDE_HELP,
  COMPANY_LONGITUDE_HELP,
} from "@/lib/constants/distance-requirement";
import {
  DEFAULT_FIT_SCORE_CUTOFF,
  FIT_SCORE_CUTOFF_HELP,
  formatDefaultFitScoreCutoffHelp,
} from "@/lib/constants/scoring-thresholds";
import {
  industriesFromState,
  splitIndustrySelection,
} from "@/lib/constants/industries";

const SCORING_THRESHOLD_MIN = 0;
const SCORING_THRESHOLD_MAX = 100;

type ConfigurationEditFormProps = {
  draft: BusinessConfigState;
  onPatch: <K extends keyof BusinessConfigState>(
    key: K,
    value: BusinessConfigState[K]
  ) => void;
  onRequirementsChange: (requirements: string[]) => void;
  rephraseSuggestions: Array<RephraseSuggestion | null>;
  onUpdateRephraseSuggestion: (index: number, clarified: string) => void;
  onKeepRephraseSuggestion: (index: number, clarified: string) => void;
  onDiscardRephraseSuggestion: (index: number) => void;
  onRephraseRequirements: () => void;
  rephrasing: boolean;
  rephraseError?: string | null;
};

export function ConfigurationEditForm({
  draft,
  onPatch,
  onRequirementsChange,
  rephraseSuggestions,
  onUpdateRephraseSuggestion,
  onKeepRephraseSuggestion,
  onDiscardRephraseSuggestion,
  onRephraseRequirements,
  rephrasing,
  rephraseError = null,
}: ConfigurationEditFormProps) {
  const distanceEnabled = draft.has_distance_requirement ?? false;

  return (
    <div className="space-y-6">
      <ConfigCard icon={Building2} title="Business Identity">
        <div className="space-y-4">
          <TextInput
            label="Business Name"
            required
            value={draft.business_name}
            onChange={() => undefined}
            readOnly
            hint={BUSINESS_NAME_IMMUTABLE_HINT}
          />
          <TextInput
            label="Sender / Team"
            required
            value={draft.sender_name}
            onChange={(value) => onPatch("sender_name", value)}
          />
          <TextArea
            label="Collaboration Intent"
            required
            rows={6}
            value={draft.collaboration_intent}
            onChange={(value) => onPatch("collaboration_intent", value)}
            placeholder={COLLABORATION_INTENT_PLACEHOLDER}
            helpContent={COLLABORATION_INTENT_HELP}
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={List} title="Requirements" titleHelpContent={REQUIREMENTS_HELP}>
        <RequirementsEditForm
          requirements={draft.requirements}
          onChange={onRequirementsChange}
          rephraseSuggestions={rephraseSuggestions}
          onUpdateRephraseSuggestion={onUpdateRephraseSuggestion}
          onKeepRephraseSuggestion={onKeepRephraseSuggestion}
          onDiscardRephraseSuggestion={onDiscardRephraseSuggestion}
        />
        <div className="mt-4 border-t border-gray-100 pt-4">
          <RequirementsModalFooter
            onCancel={() => undefined}
            onSave={() => undefined}
            onRephrase={onRephraseRequirements}
            saving={false}
            rephrasing={rephrasing}
            rephraseError={rephraseError}
            hideCancel
            hideSave
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={MapPin} title="Location">
        <div className="space-y-4">
          <SwitchInput
            label="Enable distance requirement"
            checked={distanceEnabled}
            hint={DISTANCE_REQUIREMENT_HINT}
            onChange={(value) => onPatch("has_distance_requirement", value)}
          />
          {distanceEnabled ? (
            <div className="space-y-4">
              <NumberInput
                label="Latitude"
                value={draft.lat}
                onChange={(value) => onPatch("lat", value)}
                helpContent={COMPANY_LATITUDE_HELP}
              />
              <NumberInput
                label="Longitude"
                value={draft.lon}
                onChange={(value) => onPatch("lon", value)}
                helpContent={COMPANY_LONGITUDE_HELP}
              />
              <NumberInput
                label="Max Distance (km)"
                min={0}
                value={draft.max_distance_km}
                onChange={(value) => onPatch("max_distance_km", value)}
              />
            </div>
          ) : null}
        </div>
      </ConfigCard>

      <ConfigCard icon={BarChart3} title="Scoring Thresholds">
        <div className="space-y-4">
          <NumberInput
            label="Fit Score Cutoff"
            required
            min={SCORING_THRESHOLD_MIN}
            max={SCORING_THRESHOLD_MAX}
            hint={`Must be between ${SCORING_THRESHOLD_MIN} and ${SCORING_THRESHOLD_MAX}.`}
            helpContent={`${FIT_SCORE_CUTOFF_HELP}\n${formatDefaultFitScoreCutoffHelp()}`}
            onRestoreDefaults={() => onPatch("fit_score_cutoff", DEFAULT_FIT_SCORE_CUTOFF)}
            value={draft.fit_score_cutoff}
            onChange={(value) => onPatch("fit_score_cutoff", value)}
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={Target} title="Target Partner">
        <div className="space-y-4">
          <IndustryMultiSelect
            label="Industry"
            hint={TARGET_PARTNER_INDUSTRY_HINT}
            value={industriesFromState(draft.industry, draft.industry_id)}
            onChange={(selection) => {
              const next = splitIndustrySelection(selection);
              onPatch("industry", next.industry);
              onPatch("industry_id", next.industry_id);
            }}
          />
          <TextInput
            label="Search Keyword"
            required
            value={draft.search_keyword}
            onChange={(value) => onPatch("search_keyword", value)}
            placeholder={TARGET_PARTNER_SEARCH_KEYWORD_PLACEHOLDER}
            helpContent={TARGET_PARTNER_SEARCH_KEYWORD_HELP}
          />
          <TextInput
            label="Search Location"
            required
            value={draft.search_location}
            onChange={(value) => onPatch("search_location", value)}
            placeholder={TARGET_PARTNER_SEARCH_LOCATION_PLACEHOLDER}
            helpContent={TARGET_PARTNER_SEARCH_LOCATION_HELP}
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={Users} title="Contact Preferences">
        <ContactPreferencesEditForm
          contactTitles={draft.contact_titles}
          contactCategories={draft.contact_categories}
          onContactTitlesChange={(contact_titles) =>
            onPatch("contact_titles", contact_titles)
          }
          onContactCategoriesChange={(contact_categories) =>
            onPatch("contact_categories", contact_categories)
          }
        />
      </ConfigCard>

      <ConfigCard icon={Mail} title="Outreach Settings">
        <OutreachSettingsEditForm
          businessName={draft.business_name}
          subjectLine={draft.subject_line}
          minWords={draft.min_words}
          maxWords={draft.max_words}
          onSubjectLineChange={(subject_line) => onPatch("subject_line", subject_line)}
          onMinWordsChange={(min_words) => onPatch("min_words", min_words)}
          onMaxWordsChange={(max_words) => onPatch("max_words", max_words)}
          onRestoreDefaults={() => {
            const defaults = getDefaultOutreachSettingsDraft(draft.business_name);
            onPatch("subject_line", defaults.subject_line);
            onPatch("min_words", defaults.min_words);
            onPatch("max_words", defaults.max_words);
          }}
        />
      </ConfigCard>
    </div>
  );
}

export function validateBusinessConfigDraft(
  draft: BusinessConfigState
): string | null {
  if (!draft.business_name.trim()) return "Business name is required.";
  if (!draft.sender_name.trim()) return "Sender / team is required.";
  if (!draft.subject_line.trim()) return "Email subject line is required.";
  if (!draft.collaboration_intent.trim()) return "Collaboration intent is required.";
  if (draft.requirements.map((item) => item.trim()).filter(Boolean).length === 0) {
    return "Add at least one requirement.";
  }
  if (draft.requirements.map((item) => item.trim()).filter(Boolean).length > MAX_REQUIREMENTS) {
    return `You can add up to ${MAX_REQUIREMENTS} requirements.`;
  }
  if (!draft.search_keyword.trim()) return "Search keyword is required.";
  if (!draft.search_location.trim()) return "Search location is required.";
  if (draft.industry.length !== draft.industry_id.length) {
    return "Industry selections are out of sync.";
  }
  if (draft.contact_titles.map((title) => title.trim()).filter(Boolean).length === 0) {
    return "Add at least one contact title.";
  }
  if (draft.contact_categories.length === 0) {
    return "Select at least one contact category.";
  }
  if (draft.fit_score_cutoff === null) {
    return "Fit score cutoff is required.";
  }
  if (
    draft.fit_score_cutoff < SCORING_THRESHOLD_MIN ||
    draft.fit_score_cutoff > SCORING_THRESHOLD_MAX
  ) {
    return `Fit score cutoff must be between ${SCORING_THRESHOLD_MIN} and ${SCORING_THRESHOLD_MAX}.`;
  }
  if (
    draft.min_words === null ||
    draft.max_words === null
  ) {
    return "All outreach settings fields are required.";
  }
  if (
    draft.min_words < 1 ||
    draft.max_words < 1
  ) {
    return "Outreach settings must be positive integers.";
  }
  if (draft.min_words >= draft.max_words) {
    return "Max words must be greater than min words.";
  }
  return null;
}
