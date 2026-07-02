"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  Info,
  List,
  Mail,
  MapPin,
  Settings2,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import {
  fetchBusinessConfig,
  saveBusinessProfile,
  saveClassificationCutoffs,
  saveContactFilters,
  saveRequirements,
  saveRunSettings,
  saveSearchConfig,
} from "@/lib/api/business-config-client";
import { businessConfig as mockConfig } from "@/lib/mock-data";
import type {
  BusinessConfigState,
  ConfigSection,
} from "@/lib/types/business-config";
import { DEFAULT_BUSINESS_ID } from "@/lib/types/business-config";
import { ConfigCard, Field, TagList } from "@/components/ui/ConfigCard";
import {
  RequirementsEditForm,
  RequirementsModalFooter,
} from "@/components/configuration/RequirementsEditForm";
import {
  CheckboxInput,
  linesToList,
  listToLines,
  Modal,
  ModalActions,
  NumberInput,
  TextArea,
  TextInput,
} from "@/components/ui/Modal";

const initialConfig: BusinessConfigState = {
  business_id: DEFAULT_BUSINESS_ID,
  ...mockConfig,
};

export function ConfigurationContent() {
  const [config, setConfig] = useState<BusinessConfigState>(initialConfig);
  const [draft, setDraft] = useState<BusinessConfigState>(initialConfig);
  const [activeSection, setActiveSection] = useState<ConfigSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [rephrasing, setRephrasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessConfig()
      .then((data) => {
        if (!data) return;
        setConfig((prev) => ({
          ...prev,
          ...data,
          contact_titles: data.contact_titles ?? prev.contact_titles,
          contact_categories: data.contact_categories ?? prev.contact_categories,
        }));
      })
      .catch(() => {});
  }, []);

  const openSection = useCallback(
    (section: ConfigSection) => {
      setDraft({ ...config });
      setActiveSection(section);
      setError(null);
    },
    [config]
  );

  const closeSection = useCallback(() => {
    setActiveSection(null);
    setError(null);
    setRephrasing(false);
  }, []);

  const handleRephraseRequirements = async () => {
    setRephrasing(true);
    setError(null);
    try {
      // TODO: wire to n8n LLM rephrase workflow
      await new Promise((resolve) => setTimeout(resolve, 600));
      setError("LLM Rephrase is not connected yet.");
    } finally {
      setRephrasing(false);
    }
  };

  const patchDraft = useCallback(
    <K extends keyof BusinessConfigState>(key: K, value: BusinessConfigState[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      switch (activeSection) {
        case "identity":
          await saveBusinessProfile({
            business_name: draft.business_name,
            sender_name: draft.sender_name,
            collaboration_intent: draft.collaboration_intent,
          });
          setConfig((prev) => ({
            ...prev,
            business_name: draft.business_name,
            sender_name: draft.sender_name,
            sender_email: draft.sender_email,
            collaboration_intent: draft.collaboration_intent,
          }));
          break;
        case "requirements":
          await saveRequirements({ requirements: draft.requirements });
          setConfig((prev) => ({ ...prev, requirements: draft.requirements }));
          break;
        case "location":
          setConfig((prev) => ({
            ...prev,
            latitude: draft.latitude,
            longitude: draft.longitude,
            max_distance: draft.max_distance,
          }));
          break;
        case "scoring":
          await saveClassificationCutoffs({
            fit_score_cutoff: draft.fit_score_cutoff,
            low_conf_cutoff_email_classification:
              draft.low_conf_cutoff_email_classification,
            qualified_conf_email_classification:
              draft.qualified_conf_email_classification,
          });
          setConfig((prev) => ({
            ...prev,
            fit_score_cutoff: draft.fit_score_cutoff,
            low_conf_cutoff_email_classification:
              draft.low_conf_cutoff_email_classification,
            qualified_conf_email_classification:
              draft.qualified_conf_email_classification,
          }));
          break;
        case "target":
          await saveSearchConfig({
            search_keyword: draft.search_keyword,
            search_location: draft.search_location,
          });
          setConfig((prev) => ({
            ...prev,
            search_keyword: draft.search_keyword,
            search_location: draft.search_location,
          }));
          break;
        case "contact":
          await saveContactFilters({
            contact_titles: draft.contact_titles,
            contact_categories: draft.contact_categories,
          });
          setConfig((prev) => ({
            ...prev,
            contact_titles: draft.contact_titles,
            contact_categories: draft.contact_categories,
          }));
          break;
        case "outreach":
          await saveRunSettings({
            number_of_candidates_per_run: draft.number_of_candidates_per_run,
            min_words: draft.min_words,
            max_words: draft.max_words,
          });
          setConfig((prev) => ({
            ...prev,
            number_of_candidates_per_run: draft.number_of_candidates_per_run,
            min_words: draft.min_words,
            max_words: draft.max_words,
          }));
          break;
        case "system":
          setConfig((prev) => ({
            ...prev,
            test_mode: draft.test_mode,
            test_email_override: draft.test_email_override,
            follow_up_delay: draft.follow_up_delay,
          }));
          break;
        case "partners":
          setConfig((prev) => ({
            ...prev,
            excluded_partners: draft.excluded_partners,
          }));
          break;
        default:
          break;
      }

      closeSection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const modalTitle: Record<ConfigSection, string> = {
    identity: "Edit Business Identity",
    requirements: "Edit Requirements",
    location: "Edit Location",
    scoring: "Edit Scoring Thresholds",
    target: "Edit Target Partner",
    contact: "Edit Contact Preferences",
    outreach: "Edit Outreach Settings",
    system: "Edit System Settings",
    partners: "Edit Known Partners",
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          System configuration for the lead generation pipeline
        </p>
      </div>

      <div className="space-y-6">
        <ConfigCard
          icon={Building2}
          title="Business Identity"
          onEdit={() => openSection("identity")}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Business Name" value={config.business_name} />
            <Field label="Sender / Team" value={config.sender_name} />
            <Field
              label="Sender Email"
              value={
                <a
                  href={`mailto:${config.sender_email}`}
                  className="text-violet-600 hover:text-violet-700"
                >
                  {config.sender_email}
                </a>
              }
            />
          </div>
          <div className="mt-6">
            <Field
              label="Collaboration Intent"
              value={
                <p className="rounded-lg bg-gray-50 p-4 leading-relaxed text-gray-700">
                  {config.collaboration_intent}
                </p>
              }
            />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={List}
          title="Requirements"
          onEdit={() => openSection("requirements")}
        >
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-700">
            {config.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ol>
        </ConfigCard>

        <ConfigCard
          icon={MapPin}
          title="Location"
          onEdit={() => openSection("location")}
          footer={
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="h-3.5 w-3.5" />
              Coordinates and distance are only used when geo-proximity matters.
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Latitude" value={config.latitude} />
            <Field label="Longitude" value={config.longitude} />
            <Field label="Max Distance" value={config.max_distance} />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={BarChart3}
          title="Scoring Thresholds"
          onEdit={() => openSection("scoring")}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Fit Score Cutoff" value={config.fit_score_cutoff} />
            <Field
              label="Email Classification — Low Confidence Cutoff"
              value={config.low_conf_cutoff_email_classification}
            />
            <Field
              label="Email Classification — Qualified Confidence"
              value={config.qualified_conf_email_classification}
            />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={Target}
          title="Target Partner"
          onEdit={() => openSection("target")}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Search Keyword" value={config.search_keyword} />
            <Field label="Search Location" value={config.search_location} />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={Users}
          title="Contact Preferences"
          onEdit={() => openSection("contact")}
        >
          <div className="space-y-6">
            <Field
              label="Contact Titles (Apollo API)"
              value={<TagList items={config.contact_titles} />}
            />
            <Field
              label="Contact Categories (Anymail Finder)"
              value={<TagList items={config.contact_categories} />}
            />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={Mail}
          title="Outreach Settings"
          onEdit={() => openSection("outreach")}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Min. Words per Email" value={config.min_words} />
            <Field label="Max. Words per Email" value={config.max_words} />
            <Field
              label="Candidates per Run"
              value={config.number_of_candidates_per_run}
            />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={Wrench}
          title="System Settings"
          onEdit={() => openSection("system")}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field
              label="Test Mode"
              value={
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {config.test_mode ? "Enabled" : "Disabled"}
                </span>
              }
            />
            <Field
              label="Test Email Override"
              value={
                <span className="text-violet-600">{config.test_email_override}</span>
              }
            />
            <Field label="Follow Up Delay" value={config.follow_up_delay} />
          </div>
        </ConfigCard>

        <ConfigCard
          icon={Settings2}
          title="Known Partners"
          onEdit={() => openSection("partners")}
        >
          <Field
            label="Excluded from Outreach"
            value={<TagList items={config.excluded_partners} />}
          />
        </ConfigCard>
      </div>

      <Modal
        open={activeSection !== null}
        title={activeSection ? modalTitle[activeSection] : ""}
        onClose={closeSection}
        size={activeSection === "requirements" ? "lg" : "default"}
        footer={
          activeSection === "requirements" ? (
            <RequirementsModalFooter
              onCancel={closeSection}
              onSave={handleSave}
              onRephrase={handleRephraseRequirements}
              saving={saving}
              rephrasing={rephrasing}
            />
          ) : (
            <div className="flex justify-end gap-3">
              <ModalActions
                onCancel={closeSection}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          )
        }
      >
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {activeSection === "identity" ? (
          <div className="space-y-4">
            <TextInput
              label="Business Name"
              value={draft.business_name}
              onChange={(v) => patchDraft("business_name", v)}
            />
            <TextInput
              label="Sender / Team"
              value={draft.sender_name}
              onChange={(v) => patchDraft("sender_name", v)}
            />
            <TextInput
              label="Sender Email"
              type="email"
              value={draft.sender_email}
              onChange={(v) => patchDraft("sender_email", v)}
            />
            <TextArea
              label="Collaboration Intent"
              rows={6}
              value={draft.collaboration_intent}
              onChange={(v) => patchDraft("collaboration_intent", v)}
            />
          </div>
        ) : null}

        {activeSection === "requirements" ? (
          <RequirementsEditForm
            requirements={draft.requirements}
            onChange={(requirements) => patchDraft("requirements", requirements)}
          />
        ) : null}

        {activeSection === "location" ? (
          <div className="space-y-4">
            <TextInput
              label="Latitude"
              value={draft.latitude}
              onChange={(v) => patchDraft("latitude", v)}
            />
            <TextInput
              label="Longitude"
              value={draft.longitude}
              onChange={(v) => patchDraft("longitude", v)}
            />
            <TextInput
              label="Max Distance"
              value={draft.max_distance}
              onChange={(v) => patchDraft("max_distance", v)}
            />
          </div>
        ) : null}

        {activeSection === "scoring" ? (
          <div className="space-y-4">
            <NumberInput
              label="Fit Score Cutoff"
              value={draft.fit_score_cutoff}
              onChange={(v) => patchDraft("fit_score_cutoff", v)}
            />
            <NumberInput
              label="Email Classification — Low Confidence Cutoff"
              value={draft.low_conf_cutoff_email_classification}
              onChange={(v) =>
                patchDraft("low_conf_cutoff_email_classification", v)
              }
            />
            <NumberInput
              label="Email Classification — Qualified Confidence"
              value={draft.qualified_conf_email_classification}
              onChange={(v) =>
                patchDraft("qualified_conf_email_classification", v)
              }
            />
          </div>
        ) : null}

        {activeSection === "target" ? (
          <div className="space-y-4">
            <TextInput
              label="Search Keyword"
              value={draft.search_keyword}
              onChange={(v) => patchDraft("search_keyword", v)}
            />
            <TextInput
              label="Search Location"
              value={draft.search_location}
              onChange={(v) => patchDraft("search_location", v)}
            />
          </div>
        ) : null}

        {activeSection === "contact" ? (
          <div className="space-y-4">
            <TextArea
              label="Contact Titles (Apollo API)"
              rows={6}
              hint="One title per line."
              value={listToLines(draft.contact_titles)}
              onChange={(v) => patchDraft("contact_titles", linesToList(v))}
            />
            <TextArea
              label="Contact Categories (Anymail Finder)"
              rows={4}
              hint="One category per line."
              value={listToLines(draft.contact_categories)}
              onChange={(v) => patchDraft("contact_categories", linesToList(v))}
            />
          </div>
        ) : null}

        {activeSection === "outreach" ? (
          <div className="space-y-4">
            <NumberInput
              label="Min. Words per Email"
              value={draft.min_words}
              onChange={(v) => patchDraft("min_words", v)}
            />
            <NumberInput
              label="Max. Words per Email"
              value={draft.max_words}
              onChange={(v) => patchDraft("max_words", v)}
            />
            <NumberInput
              label="Candidates per Run"
              value={draft.number_of_candidates_per_run}
              onChange={(v) => patchDraft("number_of_candidates_per_run", v)}
            />
          </div>
        ) : null}

        {activeSection === "system" ? (
          <div className="space-y-4">
            <CheckboxInput
              label="Test Mode Enabled"
              checked={draft.test_mode}
              onChange={(v) => patchDraft("test_mode", v)}
            />
            <TextInput
              label="Test Email Override"
              type="email"
              value={draft.test_email_override}
              onChange={(v) => patchDraft("test_email_override", v)}
            />
            <TextInput
              label="Follow Up Delay"
              value={draft.follow_up_delay}
              onChange={(v) => patchDraft("follow_up_delay", v)}
              placeholder="e.g. 7 days"
            />
          </div>
        ) : null}

        {activeSection === "partners" ? (
          <TextArea
            label="Excluded from Outreach"
            rows={6}
            hint="One partner name per line."
            value={listToLines(draft.excluded_partners)}
            onChange={(v) => patchDraft("excluded_partners", linesToList(v))}
          />
        ) : null}
      </Modal>
    </div>
  );
}
