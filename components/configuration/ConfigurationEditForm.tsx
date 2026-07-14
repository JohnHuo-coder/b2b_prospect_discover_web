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
import { ConfigCard } from "@/components/ui/ConfigCard";
import {
  RequirementsEditForm,
  RequirementsModalFooter,
} from "@/components/configuration/RequirementsEditForm";
import { ContactPreferencesEditForm } from "@/components/configuration/ContactPreferencesEditForm";
import {
  getDefaultRunSettingsDraft,
  OutreachSettingsEditForm,
} from "@/components/configuration/OutreachSettingsEditForm";
import {
  CheckboxInput,
  linesToList,
  listToLines,
  NumberInput,
  TextArea,
  TextInput,
} from "@/components/ui/Modal";

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
}: ConfigurationEditFormProps) {
  return (
    <div className="space-y-6">
      <ConfigCard icon={Building2} title="Business Identity">
        <div className="space-y-4">
          <TextInput
            label="Business Name"
            required
            value={draft.business_name}
            onChange={(value) => onPatch("business_name", value)}
          />
          <TextInput
            label="Sender / Team"
            value={draft.sender_name}
            onChange={(value) => onPatch("sender_name", value)}
            placeholder="Optional"
          />
          <TextInput
            label="Sender Email"
            type="email"
            value={draft.sender_email}
            onChange={(value) => onPatch("sender_email", value)}
          />
          <TextArea
            label="Collaboration Intent"
            required
            rows={6}
            value={draft.collaboration_intent}
            onChange={(value) => onPatch("collaboration_intent", value)}
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={List} title="Requirements">
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
            hideCancel
            hideSave
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={MapPin} title="Location">
        <div className="space-y-4">
          <CheckboxInput
            label="Enable distance requirement"
            checked={draft.has_distance_requirement ?? false}
            onChange={(value) => onPatch("has_distance_requirement", value)}
          />
          <NumberInput
            label="Latitude"
            value={draft.lat}
            onChange={(value) => onPatch("lat", value)}
          />
          <NumberInput
            label="Longitude"
            value={draft.lon}
            onChange={(value) => onPatch("lon", value)}
          />
          <NumberInput
            label="Max Distance (km)"
            min={0}
            value={draft.max_distance_km}
            onChange={(value) => onPatch("max_distance_km", value)}
          />
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
            value={draft.fit_score_cutoff}
            onChange={(value) => onPatch("fit_score_cutoff", value)}
          />
          <NumberInput
            label="Email Classification — Low Confidence Cutoff"
            required
            min={SCORING_THRESHOLD_MIN}
            max={SCORING_THRESHOLD_MAX}
            hint={`Must be between ${SCORING_THRESHOLD_MIN} and ${SCORING_THRESHOLD_MAX}.`}
            value={draft.low_conf_cutoff_email_classification}
            onChange={(value) =>
              onPatch("low_conf_cutoff_email_classification", value)
            }
          />
          <NumberInput
            label="Email Classification — Qualified Confidence"
            required
            min={SCORING_THRESHOLD_MIN}
            max={SCORING_THRESHOLD_MAX}
            hint={`Must be between ${SCORING_THRESHOLD_MIN} and ${SCORING_THRESHOLD_MAX}.`}
            value={draft.qualified_conf_email_classification}
            onChange={(value) =>
              onPatch("qualified_conf_email_classification", value)
            }
          />
        </div>
      </ConfigCard>

      <ConfigCard icon={Target} title="Target Partner">
        <div className="space-y-4">
          <TextInput
            label="Search Keyword"
            required
            value={draft.search_keyword}
            onChange={(value) => onPatch("search_keyword", value)}
          />
          <TextInput
            label="Search Location"
            required
            value={draft.search_location}
            onChange={(value) => onPatch("search_location", value)}
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
          minWords={draft.min_words}
          maxWords={draft.max_words}
          onMinWordsChange={(min_words) => onPatch("min_words", min_words)}
          onMaxWordsChange={(max_words) => onPatch("max_words", max_words)}
          onRestoreDefaults={() => {
            onPatch("min_words", getDefaultRunSettingsDraft().min_words);
            onPatch("max_words", getDefaultRunSettingsDraft().max_words);
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
  if (!draft.collaboration_intent.trim()) return "Collaboration intent is required.";
  if (draft.requirements.map((item) => item.trim()).filter(Boolean).length === 0) {
    return "Add at least one requirement.";
  }
  if (!draft.search_keyword.trim()) return "Search keyword is required.";
  if (!draft.search_location.trim()) return "Search location is required.";
  if (
    draft.fit_score_cutoff === null ||
    draft.low_conf_cutoff_email_classification === null ||
    draft.qualified_conf_email_classification === null
  ) {
    return "All scoring threshold fields are required.";
  }
  if (
    draft.fit_score_cutoff < SCORING_THRESHOLD_MIN ||
    draft.fit_score_cutoff > SCORING_THRESHOLD_MAX ||
    draft.low_conf_cutoff_email_classification < SCORING_THRESHOLD_MIN ||
    draft.low_conf_cutoff_email_classification > SCORING_THRESHOLD_MAX ||
    draft.qualified_conf_email_classification < SCORING_THRESHOLD_MIN ||
    draft.qualified_conf_email_classification > SCORING_THRESHOLD_MAX
  ) {
    return `Scoring thresholds must be between ${SCORING_THRESHOLD_MIN} and ${SCORING_THRESHOLD_MAX}.`;
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
