export const MERGED_FACTS_INVENTORY_EXPR = `(
  COALESCE(fi.review_facts, '{}'::text[]) ||
  COALESCE(fi.website_facts, '{}'::text[])
)`;
