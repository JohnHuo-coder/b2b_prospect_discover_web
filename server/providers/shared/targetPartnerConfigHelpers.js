export const TARGET_PARTNER_CONFIG_SELECT_FIELDS = `
  search_keyword,
  industry,
  industry_id,
  location,
  selected_source
`;

export const TARGET_PARTNER_SOURCE_GOOGLE_MAPS = "google_maps";

export function resolveSelectedSource(has_distance_requirement) {
  return has_distance_requirement === true
    ? TARGET_PARTNER_SOURCE_GOOGLE_MAPS
    : null;
}

export function mergeTargetPartnerIntoConfig(businessConfigRow, targetPartnerRow) {
  if (!businessConfigRow) {
    return null;
  }

  return {
    ...businessConfigRow,
    search_keyword: targetPartnerRow?.search_keyword ?? '',
    industry: targetPartnerRow?.industry ?? [],
    industry_id: targetPartnerRow?.industry_id ?? [],
    search_location: targetPartnerRow?.location ?? '',
  };
}
