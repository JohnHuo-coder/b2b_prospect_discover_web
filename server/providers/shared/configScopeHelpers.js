export function resolveConfigScope({ business_id, version }) {
  const currentVersion = Number(version) || 0;
  if (!business_id || currentVersion === 0) {
    return null;
  }

  return {
    business_id,
    version: currentVersion,
  };
}

export function requireConfigScope({ business_id, version }) {
  const scope = resolveConfigScope({ business_id, version });
  if (!scope) {
    throw new Error('business_id and version are required');
  }
  return scope;
}

export function scopeParams(scope) {
  return [scope.business_id, scope.version];
}

export function joinBusinessConfigOnConfigId(tableAlias) {
  return `JOIN prospect_discover.business_configs bc ON ${tableAlias}.config_id = bc.id`;
}

export function joinInitialCandidateOnConfigPlace(tableAlias, icAlias = 'ic') {
  return `JOIN prospect_discover.initial_candidates ${icAlias}
    ON ${icAlias}.config_id = ${tableAlias}.config_id
   AND ${icAlias}.place_id = ${tableAlias}.place_id`;
}

export function whereBusinessConfigScope() {
  return `bc.business_id = $1 AND bc.version = $2`;
}

export function joinRequirementsOnConfig(reqAlias = 'req') {
  return `JOIN prospect_discover.requirements ${reqAlias} ON ${reqAlias}.config_id = bc.id`;
}
