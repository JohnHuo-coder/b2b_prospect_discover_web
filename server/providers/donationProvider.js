import { pool } from '../../lib/db/client.ts';

function buildUnsentWhere({
  search,
  status,
  minAmount,
  maxAmount,
  startDate,
  endDate,
  descriptionSearch,
  requireEmail,
} = {}) {
  const LIMIT = 20;
  let where = `WHERE COALESCE(d.receipt_status, 'pending') <> 'sent'`;
  const params = [];

  if (search) {
    where += ` AND (dn.first_name LIKE ? OR dn.last_name LIKE ? OR dn.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status && status !== 'sent') {
    where += ` AND d.receipt_status = ?`;
    params.push(status);
  }
  if (minAmount) {
    where += ` AND d.amount >= ?`;
    params.push(minAmount);
  }
  if (maxAmount) {
    where += ` AND d.amount <= ?`;
    params.push(maxAmount);
  }
  if (startDate) {
    where += ` AND d.donation_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    where += ` AND d.donation_date <= ?`;
    params.push(endDate);
  }
  if (descriptionSearch) {
    where += ` AND d.description LIKE ?`;
    params.push(`%${descriptionSearch}%`);
  }

  if (requireEmail) {
    where += ` AND dn.email IS NOT NULL AND dn.email <> ''`;
  }

  return { where, params, limit: LIMIT };
}

export default {
  async getUnsentIds(filters = {}) {
    const { where, params, limit } = buildUnsentWhere({
      ...filters,
      requireEmail: true,
    });
    const [rows] = await pool.execute(
      `SELECT d.id FROM donations d JOIN donors dn ON d.donor_id = dn.id
       ${where} ORDER BY d.donation_date DESC, d.id DESC LIMIT ${limit}`,
      params
    );
    return rows.map((r) => r.id);
  },

  async getUnsentRecipients(filters = {}) {
    const { where, params, limit } = buildUnsentWhere({
      ...filters,
      requireEmail: true,
    });
    const [rows] = await pool.execute(
      `SELECT d.id, dn.first_name, dn.last_name, dn.email
       FROM donations d
       JOIN donors dn ON d.donor_id = dn.id
       ${where}
       ORDER BY d.donation_date DESC, d.id DESC
       LIMIT ${limit}`,
      params
    );
    return rows;
  },

  async markManyReceiptStatus(ids, receipt_status) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { affectedRows: 0 };
    }
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE donations SET receipt_status = ? WHERE id IN (${placeholders})`,
      [receipt_status, ...ids]
    );
    return { affectedRows: result.affectedRows };
  },

  async deleteDonation(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[donation]] = await conn.execute(
        'SELECT donor_id FROM donations WHERE id = ?',
        [id]
      );
      if (!donation) {
        await conn.rollback();
        return { affectedRows: 0 };
      }
      const [del] = await conn.execute('DELETE FROM donations WHERE id = ?', [id]);
      const [[{ cnt }]] = await conn.execute(
        'SELECT COUNT(*) AS cnt FROM donations WHERE donor_id = ?',
        [donation.donor_id]
      );
      if (parseInt(cnt) === 0) {
        await conn.execute('DELETE FROM donors WHERE id = ?', [donation.donor_id]);
      }
      await conn.commit();
      return { affectedRows: del.affectedRows };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
