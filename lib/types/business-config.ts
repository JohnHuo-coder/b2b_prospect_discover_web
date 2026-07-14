export type BusinessConfigState = {
  version: number;
  business_id: string;
  business_name: string;
  sender_name: string;
  sender_email: string;
  collaboration_intent: string;
  requirements: string[];
  has_distance_requirement: boolean | null;
  lat: number | null;
  lon: number | null;
  max_distance_km: number | null;
  fit_score_cutoff: number | null;
  low_conf_cutoff_email_classification: number | null;
  qualified_conf_email_classification: number | null;
  search_keyword: string;
  search_location: string;
  contact_titles: string[];
  contact_categories: string[];
  min_words: number | null;
  max_words: number | null;
  number_of_candidates_per_run: number | null;
};

export type BusinessConfigSavePayload = {
  business_name: string;
  sender_name: string;
  collaboration_intent: string;
  requirements: string[];
  has_distance_requirement?: boolean | null;
  lat?: number | null;
  lon?: number | null;
  max_distance_km?: number | null;
  fit_score_cutoff: number;
  low_conf_cutoff_email_classification: number;
  qualified_conf_email_classification: number;
  search_keyword: string;
  search_location: string;
  contact_titles: string[];
  contact_categories: string[];
  min_words: number;
  max_words: number;
};

export type ConfigSection =
  | "identity"
  | "requirements"
  | "location"
  | "scoring"
  | "target"
  | "contact"
  | "outreach";
