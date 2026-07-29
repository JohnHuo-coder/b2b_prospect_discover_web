const BUSINESS_CONFIG_COLUMNS = [
  'business_id',
  'version',
  'business_name',
  'sender_name',
  'description',
  'collaboration_intent',
  'number_of_candidates_per_run',
  'email_min_words',
  'email_max_words',
  'subject_line',
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
        payload.description,
        payload.collaboration_intent,
        payload.number_of_candidates_per_run,
        payload.email_min_words,
        payload.email_max_words,
        payload.subject_line,
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
  description,
  collaboration_intent,
  number_of_candidates_per_run,
  email_min_words AS min_words,
  email_max_words AS max_words,
  subject_line,
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

export async function countTodayBusinessConfigSaves(business_id, client) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM prospect_discover.business_configs
     WHERE business_id = $1
       AND created_at >= CURRENT_DATE
       AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
    [business_id]
  );

  return Number(rows[0]?.count) || 0;
}
