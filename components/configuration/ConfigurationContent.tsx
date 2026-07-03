"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  normalizeRequirements,
  rephraseRequirements,
  saveBusinessProfile,
  saveClassificationCutoffs,
  saveContactFilters,
  saveRequirements,
  saveRunSettings,
  saveSearchConfig,
  type RephraseSuggestion,
} from "@/lib/api/business-config-client";
import type {
  BusinessConfigState,
  ConfigSection,
} from "@/lib/types/business-config";
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
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { useUser } from "@/components/providers/UserProvider";

const emptyConfig: BusinessConfigState = {
  business_id: "",
  business_name: "",
  sender_name: "",
  sender_email: "",
  collaboration_intent: "",
  requirements: [],
  latitude: "",
  longitude: "",
  max_distance: "",
  fit_score_cutoff: null,
  low_conf_cutoff_email_classification: null,
  qualified_conf_email_classification: null,
  search_keyword: "",
  search_location: "",
  contact_titles: [],
  contact_categories: [],
  min_words: null,
  max_words: null,
  number_of_candidates_per_run: null,
  test_mode: null,
  test_email_override: "",
  follow_up_delay: "",
  excluded_partners: [],
};

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function displayText(value: string | null | undefined): ReactNode {
  return hasText(value) ? value.trim() : "—";
}

function displayNumber(value: number | null | undefined): ReactNode {
  if (value === null || value === undefined) {
    return "—";
  }
  return value;
}

function displayEmail(value: string | null | undefined): ReactNode {
  if (!hasText(value)) return "—";
  return (
    <a href={`mailto:${value}`} className="text-violet-600 hover:text-violet-700">
      {value}
    </a>
  );
}

function displayRequirements(requirements: string[]): ReactNode {
  if (requirements.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-700">
      {requirements.map((requirement) => (
        <li key={requirement}>{requirement}</li>
      ))}
    </ol>
  );
}

function displayBoolean(enabled: boolean | null | undefined): ReactNode {
  if (enabled === null || enabled === undefined) {
    return "—";
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${enabled ? "bg-amber-400" : "bg-gray-300"}`}
      />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

export function ConfigurationContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [config, setConfig] = useState<BusinessConfigState>(emptyConfig);
  const [draft, setDraft] = useState<BusinessConfigState>(emptyConfig);
  const [activeSection, setActiveSection] = useState<ConfigSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [rephrasing, setRephrasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [rephraseSuggestions, setRephraseSuggestions] = useState<
    Array<RephraseSuggestion | null>
  >([]);

  const isPending = Boolean(user && (!user.role || user.role === "pending"));
  const isApproved = Boolean(user && user.role && user.role !== "pending");
  const isOwner = user?.role === "owner";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !isApproved) return;

    let cancelled = false;

    const loadConfig = async () => {
      setConfigLoaded(false);
      setLoadError(null);

      try {
        const data = await fetchBusinessConfig();
        if (!cancelled) {
          setConfig(data);
          setConfigLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load configuration"
          );
          setConfig(emptyConfig);
          setConfigLoaded(true);
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isApproved]);

  const openSection = useCallback(
    (section: ConfigSection) => {
      if (!isOwner) return;
      setDraft({ ...config });
      setRephraseSuggestions([]);
      setActiveSection(section);
      setError(null);
    },
    [config, isOwner]
  );

  const closeSection = useCallback(() => {
    setActiveSection(null);
    setRephraseSuggestions([]);
    setError(null);
    setRephrasing(false);
  }, []);

  const handleRephraseRequirements = async () => {
    setRephrasing(true);
    setError(null);

    try {
      const requirements = normalizeRequirements(draft.requirements);

      if (requirements.length === 0) {
        setError("Add at least one requirement before rephrasing.");
        return;
      }

      const suggestions = await rephraseRequirements(requirements);
      setRephraseSuggestions(
        requirements.map((_, index) => suggestions[index] ?? null)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rephrase requirements");
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

  const handleRequirementsChange = useCallback((requirements: string[]) => {
    patchDraft("requirements", requirements);
    setRephraseSuggestions((prev) => {
      if (prev.every((item) => item === null)) return prev;
      if (prev.length !== requirements.length) return [];
      return prev;
    });
  }, [patchDraft]);

  const handleUpdateRephraseSuggestion = useCallback(
    (index: number, clarified: string) => {
      setRephraseSuggestions((prev) =>
        prev.map((item, i) => (i === index && item ? { ...item, clarified } : item))
      );
    },
    []
  );

  const handleKeepRephraseSuggestion = useCallback(
    (index: number, clarified: string) => {
      setDraft((prev) => ({
        ...prev,
        requirements: prev.requirements.map((item, i) =>
          i === index ? clarified : item
        ),
      }));
      setRephraseSuggestions((prev) =>
        prev.map((item, i) => (i === index ? null : item))
      );
    },
    []
  );

  const handleDiscardRephraseSuggestion = useCallback((index: number) => {
    setRephraseSuggestions((prev) =>
      prev.map((item, i) => (i === index ? null : item))
    );
  }, []);

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
            collaboration_intent: draft.collaboration_intent,
          }));
          break;
        case "requirements": {
          const requirements = normalizeRequirements(draft.requirements);
          await saveRequirements({ requirements });
          setConfig((prev) => ({ ...prev, requirements }));
          setRephraseSuggestions([]);
          break;
        }
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
            fit_score_cutoff: draft.fit_score_cutoff ?? 0,
            low_conf_cutoff_email_classification:
              draft.low_conf_cutoff_email_classification ?? 0,
            qualified_conf_email_classification:
              draft.qualified_conf_email_classification ?? 0,
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
            number_of_candidates_per_run: draft.number_of_candidates_per_run ?? 0,
            min_words: draft.min_words ?? 0,
            max_words: draft.max_words ?? 0,
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

  if (authLoading) {
    return (
      <div className="px-8 py-8">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="mt-3 h-4 w-72" />
        <div className="mt-8 space-y-6">
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isPending) {
    return (
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
          You need to join a company first.
        </div>
      </div>
    );
  }

  const editHandler = isOwner ? openSection : undefined;

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          System configuration for the lead generation pipeline
        </p>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {!configLoaded ? (
        <div className="space-y-6">
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <ConfigCard
            icon={Building2}
            title="Business Identity"
            onEdit={editHandler ? () => editHandler("identity") : undefined}
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Business Name" value={displayText(config.business_name)} />
              <Field label="Sender / Team" value={displayText(config.sender_name)} />
              <Field label="Sender Email" value={displayEmail(config.sender_email)} />
            </div>
            <div className="mt-6">
              <Field
                label="Collaboration Intent"
                value={
                  hasText(config.collaboration_intent) ? (
                    <p className="rounded-lg bg-gray-50 p-4 leading-relaxed text-gray-700">
                      {config.collaboration_intent}
                    </p>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </ConfigCard>

          <ConfigCard
            icon={List}
            title="Requirements"
            onEdit={editHandler ? () => editHandler("requirements") : undefined}
          >
            {displayRequirements(config.requirements)}
          </ConfigCard>

          <ConfigCard
            icon={MapPin}
            title="Location"
            onEdit={editHandler ? () => editHandler("location") : undefined}
            footer={
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="h-3.5 w-3.5" />
                Coordinates and distance are only used when geo-proximity matters.
              </div>
            }
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Latitude" value={displayText(config.latitude)} />
              <Field label="Longitude" value={displayText(config.longitude)} />
              <Field label="Max Distance" value={displayText(config.max_distance)} />
            </div>
          </ConfigCard>

          <ConfigCard
            icon={BarChart3}
            title="Scoring Thresholds"
            onEdit={editHandler ? () => editHandler("scoring") : undefined}
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Field
                label="Fit Score Cutoff"
                value={displayNumber(config.fit_score_cutoff)}
              />
              <Field
                label="Email Classification — Low Confidence Cutoff"
                value={displayNumber(config.low_conf_cutoff_email_classification)}
              />
              <Field
                label="Email Classification — Qualified Confidence"
                value={displayNumber(config.qualified_conf_email_classification)}
              />
            </div>
          </ConfigCard>

          <ConfigCard
            icon={Target}
            title="Target Partner"
            onEdit={editHandler ? () => editHandler("target") : undefined}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Search Keyword" value={displayText(config.search_keyword)} />
              <Field label="Search Location" value={displayText(config.search_location)} />
            </div>
          </ConfigCard>

          <ConfigCard
            icon={Users}
            title="Contact Preferences"
            onEdit={editHandler ? () => editHandler("contact") : undefined}
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
            onEdit={editHandler ? () => editHandler("outreach") : undefined}
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Min. Words per Email" value={displayNumber(config.min_words)} />
              <Field label="Max. Words per Email" value={displayNumber(config.max_words)} />
              <Field
                label="Candidates per Run"
                value={displayNumber(config.number_of_candidates_per_run)}
              />
            </div>
          </ConfigCard>

          <ConfigCard
            icon={Wrench}
            title="System Settings"
            onEdit={editHandler ? () => editHandler("system") : undefined}
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Test Mode" value={displayBoolean(config.test_mode)} />
              <Field
                label="Test Email Override"
                value={displayEmail(config.test_email_override)}
              />
              <Field label="Follow Up Delay" value={displayText(config.follow_up_delay)} />
            </div>
          </ConfigCard>

          <ConfigCard
            icon={Settings2}
            title="Known Partners"
            onEdit={editHandler ? () => editHandler("partners") : undefined}
          >
            <Field
              label="Excluded from Outreach"
              value={<TagList items={config.excluded_partners} />}
            />
          </ConfigCard>
        </div>
      )}

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
            onChange={handleRequirementsChange}
            rephraseSuggestions={rephraseSuggestions}
            onUpdateRephraseSuggestion={handleUpdateRephraseSuggestion}
            onKeepRephraseSuggestion={handleKeepRephraseSuggestion}
            onDiscardRephraseSuggestion={handleDiscardRephraseSuggestion}
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
              value={draft.fit_score_cutoff ?? 0}
              onChange={(v) => patchDraft("fit_score_cutoff", v)}
            />
            <NumberInput
              label="Email Classification — Low Confidence Cutoff"
              value={draft.low_conf_cutoff_email_classification ?? 0}
              onChange={(v) =>
                patchDraft("low_conf_cutoff_email_classification", v)
              }
            />
            <NumberInput
              label="Email Classification — Qualified Confidence"
              value={draft.qualified_conf_email_classification ?? 0}
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
              value={draft.min_words ?? 0}
              onChange={(v) => patchDraft("min_words", v)}
            />
            <NumberInput
              label="Max. Words per Email"
              value={draft.max_words ?? 0}
              onChange={(v) => patchDraft("max_words", v)}
            />
            <NumberInput
              label="Candidates per Run"
              value={draft.number_of_candidates_per_run ?? 0}
              onChange={(v) => patchDraft("number_of_candidates_per_run", v)}
            />
          </div>
        ) : null}

        {activeSection === "system" ? (
          <div className="space-y-4">
            <CheckboxInput
              label="Test Mode Enabled"
              checked={draft.test_mode ?? false}
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
