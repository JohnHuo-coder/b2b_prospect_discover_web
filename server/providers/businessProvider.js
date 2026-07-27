import { pool } from '../../lib/db/client.ts';
import industryRepository from '../repositories/industryRepository.js';
import {
  CANDIDATES_PER_RUN_RANGE_ERROR,
  clampCandidatesPerRun,
  isValidCandidatesPerRun,
} from '../../lib/constants/candidates-per-run.ts';
import {
  buildBusinessConfigInsertQuery,
  BUSINESS_CONFIG_SELECT_FIELDS,
  countTodayBusinessConfigSaves,
  toPublicBusinessConfig,
} from './shared/businessConfigHelpers.js';
import {
  CONFIG_SAVE_TOO_FREQUENT_MESSAGE,
  DAILY_CONFIG_SAVE_LIMIT,
} from '../../lib/constants/config-save-limit.ts';
import {
  mergeTargetPartnerIntoConfig,
  resolveSelectedSource,
  TARGET_PARTNER_CONFIG_SELECT_FIELDS,
} from './shared/targetPartnerConfigHelpers.js';

const configInsert = buildBusinessConfigInsertQuery();
const DEFAULT_CANDIDATES_PER_RUN = 50;

async function getRequirementsByConfigId(config_id, client = pool) {
  const { rows } = await client.query(
    `SELECT id, config_id, clarified, req_index, topic_list
     FROM prospect_discover.requirements
     WHERE config_id = $1
     ORDER BY req_index ASC`,
    [config_id]
  );
  return rows;
}

async function getTargetPartnerConfigByConfigId(config_id, client = pool) {
  const { rows } = await client.query(
    `SELECT ${TARGET_PARTNER_CONFIG_SELECT_FIELDS}
     FROM prospect_discover.target_partner_config
     WHERE config_id = $1`,
    [config_id]
  );
  return rows[0] ?? null;
}

async function getBusinessConfigRow(business_id, version, client = pool) {
  const { rows } = await client.query(
    `SELECT ${BUSINESS_CONFIG_SELECT_FIELDS}
     FROM prospect_discover.business_configs
     WHERE business_id = $1
       AND version = $2`,
    [business_id, version]
  );
  return rows[0] ?? null;
}


async function getBusinessVersion(business_id, client = pool) {
  const { rows } = await client.query(
    `SELECT version
     FROM prospect_discover.businesses
     WHERE id = $1`,
    [business_id]
  );

  if (rows.length === 0) {
    throw new Error('Business not found');
  }

  return Number(rows[0].version) || 0;
}

function buildConfigResponse(version, business_config, business_requirements) {
  return {
    version,
    business_config: business_config ? toPublicBusinessConfig(business_config) : null,
    business_requirements,
  };
}

export default {
  async createBusiness({ uid, business_name }) {
    const normalizedName =
      typeof business_name === "string" ? business_name.trim() : "";
    if (!normalizedName) {
      throw new Error("business_name is required");
    }

    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.businesses (firebase_uid, business_name, version)
       VALUES ($1, $2, 0)
       RETURNING id, version`,
      [uid, normalizedName]
    );

    return {
      business_id: rows[0].id,
      version: Number(rows[0].version) || 0,
      uid,
      business_name: normalizedName,
    };
  },

  async deleteBusinessByUid(uid) {
    await pool.query(`DELETE FROM prospect_discover.businesses WHERE firebase_uid = $1`, [uid]);
  },

  async getBusinessConfig(business_id, requestedVersion = null) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const maxVersion = await getBusinessVersion(business_id);
    const version =
      requestedVersion !== null && requestedVersion !== undefined
        ? Number(requestedVersion) || 0
        : maxVersion;

    if (version === 0) {
      const { rows } = await pool.query(
        `SELECT id, business_name
         FROM prospect_discover.businesses
         WHERE id = $1`,
        [business_id]
      );

      const business = rows[0];
      const placeholderConfig = business
        ? {
            business_id: business.id,
            business_name: business.business_name,
          }
        : null;

      return buildConfigResponse(0, placeholderConfig, []);
    }

    const business_config = await getBusinessConfigRow(business_id, version);

    if (!business_config) {
      return buildConfigResponse(version, null, []);
    }

    const business_requirements = await getRequirementsByConfigId(business_config.id);
    const target_partner_config = await getTargetPartnerConfigByConfigId(business_config.id);
    const mergedConfig = mergeTargetPartnerIntoConfig(
      business_config,
      target_partner_config
    );

    return buildConfigResponse(version, mergedConfig, business_requirements);
  },

  async insertBusinessConfig({
    business_id,
    sender_name,
    collaboration_intent,
    search_keyword,
    search_location,
    industry,
    industry_id,
    email_min_words,
    email_max_words,
    subject_line,
    fit_score_cutoff,
    contact_titles,
    contact_categories,
    requirements,
    has_distance_requirement,
    lat,
    lon,
    max_distance_km,
  }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!Array.isArray(requirements)) {
      throw new Error('requirements must be an array');
    }
    if (!Array.isArray(contact_titles) || !Array.isArray(contact_categories)) {
      throw new Error('contact_titles and contact_categories must be arrays');
    }

    if (!Array.isArray(industry) || !Array.isArray(industry_id)) {
      throw new Error('industry and industry_id must be arrays');
    }

    const resolvedIndustry = industry.map((item) =>
      typeof item === 'string' ? item.trim() : ''
    );
    const resolvedIndustryId = industry_id.map((item) => Number(item));

    if (resolvedIndustry.length !== resolvedIndustryId.length) {
      throw new Error('industry and industry_id must have the same length');
    }

    const isValidIndustries = await industryRepository.validateIndustrySelections(
      resolvedIndustry,
      resolvedIndustryId
    );
    if (!isValidIndustries) {
      throw new Error('Select valid industries from the list');
    }

    const resolvedSearchKeyword =
      typeof search_keyword === 'string' ? search_keyword.trim() : '';
    if (!resolvedSearchKeyword) {
      throw new Error('search_keyword is required');
    }

    const resolvedLocation =
      typeof search_location === 'string' ? search_location.trim() : '';
    if (!resolvedLocation) {
      throw new Error('search_location is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: businessRows } = await client.query(
        `SELECT version, business_name
         FROM prospect_discover.businesses
         WHERE id = $1
         FOR UPDATE`,
        [business_id]
      );

      if (businessRows.length === 0) {
        throw new Error('Business not found');
      }

      const currentVersion = Number(businessRows[0].version) || 0;
      const nextVersion = currentVersion + 1;
      const canonicalBusinessName = String(businessRows[0].business_name || '').trim();
      if (!canonicalBusinessName) {
        throw new Error('Business name is required');
      }

      const todaySaveCount = await countTodayBusinessConfigSaves(business_id, client);
      if (todaySaveCount >= DAILY_CONFIG_SAVE_LIMIT) {
        throw new Error(CONFIG_SAVE_TOO_FREQUENT_MESSAGE);
      }

      let number_of_candidates_per_run = DEFAULT_CANDIDATES_PER_RUN;
      if (currentVersion > 0) {
        const previousConfig = await getBusinessConfigRow(
          business_id,
          currentVersion,
          client
        );
        if (previousConfig?.number_of_candidates_per_run != null) {
          number_of_candidates_per_run = clampCandidatesPerRun(
            Number(previousConfig.number_of_candidates_per_run)
          );
        }
      }

      const insertValues = configInsert.valuesFromPayload(business_id, nextVersion, {
        business_name: canonicalBusinessName,
        sender_name: sender_name?.trim() ? sender_name.trim() : null,
        collaboration_intent,
        number_of_candidates_per_run,
        email_min_words,
        email_max_words,
        subject_line,
        fit_score_cutoff,
        contact_titles,
        contact_categories,
        has_distance_requirement: has_distance_requirement ?? null,
        lat: lat ?? null,
        lon: lon ?? null,
        max_distance_km: max_distance_km ?? null,
      });

      const { rows: configRows } = await client.query(
        `INSERT INTO prospect_discover.business_configs (${configInsert.columnList})
         VALUES (${configInsert.placeholders})
         RETURNING id`,
        insertValues
      );

      const config_id = configRows[0].id;
      const selected_source = resolveSelectedSource(has_distance_requirement);

      await client.query(
        `INSERT INTO prospect_discover.target_partner_config
           (config_id, search_keyword, industry, industry_id, location, selected_source)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          config_id,
          resolvedSearchKeyword,
          resolvedIndustry,
          resolvedIndustryId,
          resolvedLocation,
          selected_source,
        ]
      );

      if (requirements.length > 0) {
        await client.query(
          `INSERT INTO prospect_discover.requirements (config_id, clarified, req_index)
           SELECT $1, r.clarified, r.ord::integer
           FROM unnest($2::text[]) WITH ORDINALITY AS r(clarified, ord)`,
          [config_id, requirements]
        );
      }

      await client.query(
        `UPDATE prospect_discover.businesses
         SET version = $2
         WHERE id = $1`,
        [business_id, nextVersion]
      );

      await client.query('COMMIT');

      const business_config = await getBusinessConfigRow(
        business_id,
        nextVersion,
        client
      );
      const target_partner_config = await getTargetPartnerConfigByConfigId(
        config_id,
        client
      );
      const mergedConfig = mergeTargetPartnerIntoConfig(
        business_config,
        target_partner_config
      );
      const business_requirements = await getRequirementsByConfigId(config_id);

      return buildConfigResponse(nextVersion, mergedConfig, business_requirements);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateCandidatesPerRun({ business_id, number_of_candidates_per_run }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!isValidCandidatesPerRun(number_of_candidates_per_run)) {
      throw new Error(CANDIDATES_PER_RUN_RANGE_ERROR);
    }

    const version = await getBusinessVersion(business_id);
    if (version < 1) {
      throw new Error('Configuration required before setting candidates per run');
    }

    const { rows } = await pool.query(
      `UPDATE prospect_discover.business_configs
       SET number_of_candidates_per_run = $3
       WHERE business_id = $1
         AND version = $2
       RETURNING number_of_candidates_per_run`,
      [business_id, version, number_of_candidates_per_run]
    );

    if (rows.length === 0) {
      throw new Error('Business config not found');
    }

    return {
      number_of_candidates_per_run: Number(rows[0].number_of_candidates_per_run),
    };
  },
};
