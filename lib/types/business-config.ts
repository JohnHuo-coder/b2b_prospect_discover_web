export const DEFAULT_BUSINESS_ID =
  process.env.NEXT_PUBLIC_BUSINESS_ID ?? "suvarnaveda-wellness";

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
  fit_score_cutoff: number;
  low_conf_cutoff_email_classification: number;
  qualified_conf_email_classification: number;
  search_keyword: string;
  search_location: string;
  contact_titles: string[];
  contact_categories: string[];
  min_words: number;
  max_words: number;
  number_of_candidates_per_run: number;
  test_mode: boolean;
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
