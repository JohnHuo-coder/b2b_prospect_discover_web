export type BusinessConfigState = {
  business_id: string;
  business_name: string;
  sender_name: string;
  sender_email: string;
  collaboration_intent: string;
  requirements: string[];
  latitude: string;
  longitude: string;
  max_distance: string;
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
  test_mode: boolean | null;
  test_email_override: string;
  follow_up_delay: string;
  excluded_partners: string[];
};

export type ConfigSection =
  | "identity"
  | "requirements"
  | "location"
  | "scoring"
  | "target"
  | "contact"
  | "outreach"
  | "system"
  | "partners";
