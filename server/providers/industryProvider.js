import { pool } from '../../lib/db/client.ts';

const SEARCH_LIMIT = 20;

export default {
  async searchIndustries(search) {
    const query = typeof search === 'string' ? search.trim() : '';
    if (!query) {
      return [];
    }

    const { rows } = await pool.query(
      `SELECT id, label
       FROM prospect_discover.linkedin_industry_codes
       WHERE label ILIKE $1
       ORDER BY label ASC
       LIMIT $2`,
      [`%${query}%`, SEARCH_LIMIT]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      label: String(row.label),
    }));
  },

  async validateIndustrySelections(industries, industry_ids) {
    if (!Array.isArray(industries) || !Array.isArray(industry_ids)) {
      return false;
    }

    if (industries.length !== industry_ids.length) {
      return false;
    }

    if (industries.length === 0) {
      return true;
    }

    const labels = industries.map((item) =>
      typeof item === 'string' ? item.trim() : ''
    );
    const ids = industry_ids.map((item) => Number(item));

    if (labels.some((label) => !label)) {
      return false;
    }

    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      return false;
    }

    if (new Set(ids).size !== ids.length) {
      return false;
    }

    const { rows } = await pool.query(
      `SELECT id, label
       FROM prospect_discover.linkedin_industry_codes
       WHERE id = ANY($1::int[])`,
      [ids]
    );

    if (rows.length !== ids.length) {
      return false;
    }

    const labelsById = new Map(
      rows.map((row) => [Number(row.id), String(row.label).trim()])
    );

    return ids.every((id, index) => labelsById.get(id) === labels[index]);
  },
};
