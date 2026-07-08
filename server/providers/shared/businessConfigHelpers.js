import { pool } from '../../../lib/db/client.ts';

export async function upsertBusinessConfigPartial(business_id, fields, client = pool) {
  if (!business_id) {
    throw new Error('business_id is required');
  }

  const columns = Object.keys(fields);
  const values = Object.values(fields);
  const columnList = ['business_id', ...columns].join(', ');
  const placeholders = columns.map((_, index) => `$${index + 2}`).join(', ');
  const setClause = columns
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(',\n        ');

  const { rows, rowCount } = await client.query(
    `INSERT INTO prospect_discover.business_configs (${columnList})
     VALUES ($1, ${placeholders})
     ON CONFLICT (business_id) DO UPDATE SET
       ${setClause}
     RETURNING *`,
    [business_id, ...values]
  );

  return { row: rows[0] ?? null, affectedRows: rowCount };
}
