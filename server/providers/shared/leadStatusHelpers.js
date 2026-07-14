export const PENDING_LEAD_DB_STATUSES = ['pending', 'review_needed'];

export function pendingLeadStatusSql(columnAlias = 'ic.status') {
  const statuses = PENDING_LEAD_DB_STATUSES.map((status) => `'${status}'`).join(', ');
  return `${columnAlias} IN (${statuses})`;
}

export function buildLeadStatusFilterClause(status, addParam) {
  if (!status) {
    return '';
  }

  if (status === 'pending') {
    const placeholders = PENDING_LEAD_DB_STATUSES.map((value) => addParam(value)).join(', ');
    return ` AND ic.status IN (${placeholders})`;
  }

  return ` AND ic.status = ${addParam(status)}`;
}
