const BUSINESS_CONFIG_COLUMNS = [
  'business_id',
  'version',
  'business_name',
  'sender_name',
  'collaboration_intent',
  'search_keyword',
  'search_location',
  'number_of_candidates_per_run',
  'email_min_words',
  'email_max_words',
  'low_conf_cutoff_email_classification',
  'qualified_conf_email_classification',
  'fit_score_cutoff',
  'contact_titles',
  'contact_categories',
  'has_distance_requirement',
  'lat',
  'lon',
  'max_distance_km',
];

export function buildBusinessConfigInsertQuery() {
  const columnList = BUSINESS_CONFIG_COLUMNS.join(', ');
  const placeholders = BUSINESS_CONFIG_COLUMNS.map((_, index) => `$${index + 1}`).join(', ');

  return {
    columnList,
    placeholders,
    valuesFromPayload(business_id, version, payload) {
      return [
        business_id,
        version,
        payload.business_name,
        payload.sender_name,
        payload.collaboration_intent,
        payload.search_keyword,
        payload.search_location,
        payload.number_of_candidates_per_run,
        payload.email_min_words,
        payload.email_max_words,
        payload.low_conf_cutoff_email_classification,
        payload.qualified_conf_email_classification,
        payload.fit_score_cutoff,
        payload.contact_titles,
        payload.contact_categories,
        payload.has_distance_requirement,
        payload.lat,
        payload.lon,
        payload.max_distance_km,
      ];
    },
  };
}

export const BUSINESS_CONFIG_SELECT_FIELDS = `
  id,
  business_id,
  version,
  business_name,
  sender_name,
  collaboration_intent,
  search_keyword,
  search_location,
  number_of_candidates_per_run,
  email_min_words AS min_words,
  email_max_words AS max_words,
  low_conf_cutoff_email_classification,
  qualified_conf_email_classification,
  fit_score_cutoff,
  contact_titles,
  contact_categories,
  has_distance_requirement,
  lat,
  lon,
  max_distance_km
`;

export function toPublicBusinessConfig(row) {
  if (!row) return null;

  const { id: _configId, ...publicConfig } = row;
  return publicConfig;
}
