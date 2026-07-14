"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  Info,
  List,
  Mail,
  MapPin,
  Pencil,
  Target,
  Users,
} from "lucide-react";
import {
  buildBusinessConfigSavePayload,
  fetchBusinessConfig,
  isBusinessConfigDraftDirty,
  normalizeRequirements,
  rephraseRequirements,
  saveBusinessConfig,
  type RephraseSuggestion,
} from "@/lib/api/business-config-client";
import type { BusinessConfigState } from "@/lib/types/business-config";
import {
  ConfigurationEditForm,
  validateBusinessConfigDraft,
} from "@/components/configuration/ConfigurationEditForm";
import { ConfigCard, Field, TagList } from "@/components/ui/ConfigCard";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { useUser } from "@/components/providers/UserProvider";
import {
  DEFAULT_CONTACT_TITLES,
  DEFAULT_RUN_SETTINGS,
} from "@/lib/constants/config-defaults";

const emptyConfig: BusinessConfigState = {
  version: 0,
  business_id: "",
  business_name: "",
  sender_name: "",
  sender_email: "",
  collaboration_intent: "",
  requirements: [],
  has_distance_requirement: null,
  lat: null,
  lon: null,
  max_distance_km: null,
  fit_score_cutoff: null,
  low_conf_cutoff_email_classification: null,
  qualified_conf_email_classification: null,
  search_keyword: "",
  search_location: "",
  contact_titles: [...DEFAULT_CONTACT_TITLES],
  contact_categories: [],
  min_words: DEFAULT_RUN_SETTINGS.min_words,
  max_words: DEFAULT_RUN_SETTINGS.max_words,
  number_of_candidates_per_run: DEFAULT_RUN_SETTINGS.number_of_candidates_per_run,
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
  const { user, isLoading: authLoading, refreshUser } = useUser();
  const [config, setConfig] = useState<BusinessConfigState>(emptyConfig);
  const [draft, setDraft] = useState<BusinessConfigState>(emptyConfig);
  const [isEditing, setIsEditing] = useState(false);
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
  const isDraftDirty = useMemo(
    () => isBusinessConfigDraftDirty(draft, config),
    [draft, config]
  );

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
          if (data.version === 0 && user?.role === "owner") {
            setDraft(data);
            setIsEditing(true);
          }
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
  }, [authLoading, isApproved, user?.role]);

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

  const handleStartEditing = () => {
    setDraft({ ...config });
    setRephraseSuggestions([]);
    setError(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (config.version === 0) return;
    setDraft({ ...config });
    setRephraseSuggestions([]);
    setError(null);
    setIsEditing(false);
  };

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
    if (!isBusinessConfigDraftDirty(draft, config)) {
      return;
    }

    const validationError = validateBusinessConfigDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saved = await saveBusinessConfig(buildBusinessConfigSavePayload(draft));
      setConfig({
        ...saved,
        sender_email: draft.sender_email,
      });
      setRephraseSuggestions([]);
      setIsEditing(false);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            System configuration for the lead generation pipeline
          </p>
          {config.version > 0 ? (
            <p className="mt-1 text-xs text-gray-400">Version: {config.version}</p>
          ) : null}
        </div>

        {isOwner && configLoaded ? (
          isEditing ? (
            <div className="flex flex-wrap items-center gap-3">
              {config.version > 0 ? (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={saving || rephrasing}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || rephrasing || !isDraftDirty}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : config.version === 0 ? "Save and continue" : "Save configuration"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEditing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              <Pencil className="h-4 w-4" />
              Edit configuration
            </button>
          )
        ) : null}
      </div>

      {loadError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {configLoaded && config.version === 0 && isEditing ? (
        <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          Complete your business configuration to get started. This is required before
          you can run the pipeline.
        </div>
      ) : null}

      {!configLoaded ? (
        <div className="space-y-6">
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
        </div>
      ) : isEditing ? (
        <ConfigurationEditForm
          draft={draft}
          onPatch={patchDraft}
          onRequirementsChange={handleRequirementsChange}
          rephraseSuggestions={rephraseSuggestions}
          onUpdateRephraseSuggestion={handleUpdateRephraseSuggestion}
          onKeepRephraseSuggestion={handleKeepRephraseSuggestion}
          onDiscardRephraseSuggestion={handleDiscardRephraseSuggestion}
          onRephraseRequirements={handleRephraseRequirements}
          rephrasing={rephrasing}
        />
      ) : (
        <div className="space-y-6">
          <ConfigCard icon={Building2} title="Business Identity">
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

          <ConfigCard icon={List} title="Requirements">
            {displayRequirements(config.requirements)}
          </ConfigCard>

          <ConfigCard
            icon={MapPin}
            title="Location"
            footer={
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="h-3.5 w-3.5" />
                Coordinates and distance are only used when geo-proximity matters.
              </div>
            }
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Distance Requirement"
                value={displayBoolean(config.has_distance_requirement)}
              />
              <Field label="Latitude" value={displayNumber(config.lat)} />
              <Field label="Longitude" value={displayNumber(config.lon)} />
              <Field label="Max Distance (km)" value={displayNumber(config.max_distance_km)} />
            </div>
          </ConfigCard>

          <ConfigCard icon={BarChart3} title="Scoring Thresholds">
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

          <ConfigCard icon={Target} title="Target Partner">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Search Keyword" value={displayText(config.search_keyword)} />
              <Field label="Search Location" value={displayText(config.search_location)} />
            </div>
          </ConfigCard>

          <ConfigCard icon={Users} title="Contact Preferences">
            <div className="space-y-6">
              <Field
                label="Contact Titles (Apollo API)"
                value={<TagList items={config.contact_titles} />}
              />
              <Field
                label="Contact Categories (Anymail Finder)"
                value={
                  <TagList items={config.contact_categories} variant="purple" />
                }
              />
            </div>
          </ConfigCard>

          <ConfigCard icon={Mail} title="Outreach Settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Min. Words per Email" value={displayNumber(config.min_words)} />
              <Field label="Max. Words per Email" value={displayNumber(config.max_words)} />
            </div>
          </ConfigCard>
        </div>
      )}
    </div>
  );
}
