export function resolveRequestedConfigVersion(user, requestedVersion) {
  const currentVersion = Number(user.config_version) || 0;
  if (currentVersion === 0) {
    return { ok: false, reason: 'no_config' };
  }

  const raw =
    requestedVersion === undefined || requestedVersion === null
      ? ''
      : String(requestedVersion).trim();

  if (!raw) {
    return {
      ok: true,
      version: currentVersion,
      currentVersion,
    };
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > currentVersion) {
    return { ok: false, reason: 'invalid_version' };
  }

  return {
    ok: true,
    version: parsed,
    currentVersion,
  };
}
