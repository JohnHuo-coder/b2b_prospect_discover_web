import { pool } from '../../lib/db/client.ts';
import { upsertBusinessConfigPartial } from './shared/businessConfigHelpers.js';

export default {
  async createBusiness({ uid, business_name }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO prospect_discover.businesses (firebase_uid, business_name)
         VALUES ($1, $2)
         RETURNING id`,
        [uid, business_name]
      );

      const business_id = rows[0].id;

      await client.query(
        `INSERT INTO prospect_discover.business_configs (business_id, business_name)
         VALUES ($1, $2)`,
        [business_id, business_name]
      );

      await client.query('COMMIT');
      return { business_id, uid, business_name };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async deleteBusinessByUid(uid) {
    await pool.query(`DELETE FROM prospect_discover.businesses WHERE firebase_uid = $1`, [uid]);
  },

  async upsertBusinessProfile({
    business_id,
    business_name,
    sender_name,
    collaboration_intent,
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rowCount: businessRowCount } = await client.query(
        `UPDATE prospect_discover.businesses
         SET business_name = $2
         WHERE id = $1`,
        [business_id, business_name]
      );

      if (businessRowCount === 0) {
        throw new Error('Business not found');
      }

      const configResult = await upsertBusinessConfigPartial(
        business_id,
        {
          business_name,
          sender_name: sender_name?.trim() ? sender_name.trim() : null,
          collaboration_intent,
        },
        client
      );

      await client.query('COMMIT');
      return configResult;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async upsertClassificationCutoffs({
    business_id,
    low_conf_cutoff_email_classification,
    qualified_conf_email_classification,
    fit_score_cutoff,
  }) {
    return upsertBusinessConfigPartial(business_id, {
      low_conf_cutoff_email_classification,
      qualified_conf_email_classification,
      fit_score_cutoff,
    });
  },

  async upsertSearchConfig({ business_id, search_keyword, search_location }) {
    return upsertBusinessConfigPartial(business_id, {
      search_keyword,
      search_location,
    });
  },

  async upsertRunSettings({
    business_id,
    number_of_candidates_per_run,
    min_words,
    max_words,
  }) {
    return upsertBusinessConfigPartial(business_id, {
      number_of_candidates_per_run,
      email_min_words: min_words,
      email_max_words: max_words,
    });
  },

  async upsertContactFilters({
    business_id,
    contact_titles,
    contact_categories,
  }) {
    if (!Array.isArray(contact_titles) || !Array.isArray(contact_categories)) {
      throw new Error('contact_titles and contact_categories must be arrays');
    }

    return upsertBusinessConfigPartial(business_id, {
      contact_titles,
      contact_categories,
    });
  },

  async getBusinessConfig(business_id) {
    if (!business_id) {
      throw new Error('business_id is required');
    }

    const [config, requirements] = await Promise.all([
      pool.query(
        `SELECT
          business_id,
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
          contact_categories
        FROM prospect_discover.business_configs
        WHERE business_id = $1`,
        [business_id]
      ),
      pool.query(
        `SELECT id, business_id, original, clarified, reason, req_index, topic_list
         FROM prospect_discover.requirements
         WHERE business_id = $1
         ORDER BY req_index ASC`,
        [business_id]
      ),
    ]);

    return {
      business_config: config.rows[0],
      business_requirements: requirements.rows,
    };
  },

  async upsertRequirements({ business_id, requirements }) {
    if (!business_id) {
      throw new Error('business_id is required');
    }
    if (!Array.isArray(requirements)) {
      throw new Error('requirements must be an array');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM prospect_discover.requirements WHERE business_id = $1`,
        [business_id]
      );

      if (requirements.length === 0) {
        await client.query('COMMIT');
        return { rows: [], affectedRows: 0 };
      }

      const { rows } = await client.query(
        `INSERT INTO prospect_discover.requirements (business_id, clarified, req_index)
         SELECT $1, r.clarified, r.ord::integer
         FROM unnest($2::text[]) WITH ORDINALITY AS r(clarified, ord)
         RETURNING *`,
        [business_id, requirements]
      );

      await client.query('COMMIT');
      return { rows, affectedRows: rows.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
