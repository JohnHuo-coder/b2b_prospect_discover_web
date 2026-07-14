import { errorResponse } from "@/lib/api/response";

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

export function getConfigScope(user: DbUserWithConfig): ConfigScope | null {
  if (!user.business_id) {
    return null;
  }

  const version = Number(user.config_version) || 0;
  if (version === 0) {
    return null;
  }

  return {
    business_id: user.business_id,
    version,
  };
}
