import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

function parseString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
}

function parseRequirements(value: unknown): string[] | null {
  const items = parseStringArray(value);
  return items && items.length > 0 ? items : null;
}

function parseInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return null;
  return numeric;
}

function parseScoringThreshold(value: unknown): number | null {
  const numeric = parseInteger(value);
  if (numeric === null || numeric < 0 || numeric > 100) return null;
  return numeric;
}

function parseOptionalBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  return null;
}

function parseOptionalFloat(
  value: unknown,
  fieldName: string
): number | null | { error: string } {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { error: `${fieldName} must be a number` };
  }
  return numeric;
}

function parseSaveBody(body: Record<string, unknown>) {
  const business_name = parseString(body.business_name);
  const collaboration_intent = parseString(body.collaboration_intent);
  const sender_name = parseString(body.sender_name);
  const search_keyword = parseString(body.search_keyword);
  const search_location = parseString(body.search_location);
  const requirements = parseRequirements(body.requirements);
  const contact_titles = parseStringArray(body.contact_titles);
  const contact_categories = parseStringArray(body.contact_categories);
  const fit_score_cutoff = parseScoringThreshold(body.fit_score_cutoff);
  const low_conf_cutoff_email_classification = parseScoringThreshold(
    body.low_conf_cutoff_email_classification
  );
  const qualified_conf_email_classification = parseScoringThreshold(
    body.qualified_conf_email_classification
  );
  const min_words = parseInteger(body.min_words);
  const max_words = parseInteger(body.max_words);
  const has_distance_requirement = parseOptionalBoolean(body.has_distance_requirement);
  const lat = parseOptionalFloat(body.lat, "lat");
  const lon = parseOptionalFloat(body.lon, "lon");
  const max_distance_km = parseOptionalFloat(body.max_distance_km, "max_distance_km");

  if (typeof lat === "object" && lat !== null && "error" in lat) return lat;
  if (typeof lon === "object" && lon !== null && "error" in lon) return lon;
  if (
    typeof max_distance_km === "object" &&
    max_distance_km !== null &&
    "error" in max_distance_km
  ) {
    return max_distance_km;
  }

  if (!business_name) return { error: "business_name is required" };
  if (!collaboration_intent) return { error: "collaboration_intent is required" };
  if (!requirements) return { error: "requirements must be a non-empty array" };
  if (!search_keyword) return { error: "search_keyword is required" };
  if (!search_location) return { error: "search_location is required" };
  if (!contact_titles) return { error: "contact_titles must be an array" };
  if (!contact_categories) return { error: "contact_categories must be an array" };
  if (fit_score_cutoff === null) {
    return { error: "fit_score_cutoff must be an integer between 0 and 100" };
  }
  if (low_conf_cutoff_email_classification === null) {
    return {
      error:
        "low_conf_cutoff_email_classification must be an integer between 0 and 100",
    };
  }
  if (qualified_conf_email_classification === null) {
    return {
      error:
        "qualified_conf_email_classification must be an integer between 0 and 100",
    };
  }
  if (min_words === null || min_words < 1) {
    return { error: "min_words must be a positive integer" };
  }
  if (max_words === null || max_words < 1) {
    return { error: "max_words must be a positive integer" };
  }
  if (min_words >= max_words) {
    return { error: "max_words must be greater than min_words" };
  }

  return {
    payload: {
      business_name,
      sender_name,
      collaboration_intent,
      search_keyword,
      search_location,
      requirements,
      contact_titles,
      contact_categories,
      fit_score_cutoff,
      low_conf_cutoff_email_classification,
      qualified_conf_email_classification,
      email_min_words: min_words,
      email_max_words: max_words,
      has_distance_requirement,
      lat,
      lon,
      max_distance_km,
    },
  };
}

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.business_id) {
        return errorResponse("You need to join a company first", 403);
      }

      const config = await businessRepository.getBusinessConfig(user.business_id);
      return jsonResponse(config);
    } catch (error) {
      console.error("[GET /api/business/config]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);

export const POST = withAuth(
  withApproved(
    withOwner(async (request: Request, _context: unknown, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseSaveBody(body);

        if ("error" in parsed) {
          return errorResponse(parsed.error, 400);
        }

        const result = await businessRepository.insertBusinessConfig({
          business_id: user.business_id,
          ...parsed.payload,
        });

        return jsonResponse(result);
      } catch (error) {
        console.error("[POST /api/business/config]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
