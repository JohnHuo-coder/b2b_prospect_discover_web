import { errorResponse } from "@/lib/api/response";

import { resolveRequestedConfigVersion } from "@/server/providers/shared/dashboardVersionHelpers.js";

export type DbUserWithConfig = {
  business_id?: number | string | null;
  config_version?: number | null;
};

export type ConfigScope = {
  business_id: number | string;
  version: number;
};

export function requireBusinessAffiliation(user: DbUserWithConfig) {
  if (!user.business_id) {
    return errorResponse("Business affiliation required", 403);
  }
  return null;
}

export function getConfigScope(
  user: DbUserWithConfig,
  requestedVersion?: string | number | null
): ConfigScope | null {
  if (!user.business_id) {
    return null;
  }

  const currentVersion = Number(user.config_version) || 0;
  if (currentVersion === 0) {
    return null;
  }

  const resolved = resolveRequestedConfigVersion(user, requestedVersion ?? null);
  if (!resolved.ok) {
    return null;
  }

  return {
    business_id: user.business_id,
    version: resolved.version!,
  };
}
