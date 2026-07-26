import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL in .env");
}

// Vercel/serverless: use Supabase *transaction* pooler (port 6543), not session (5432).
const isServerless =
  process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },

  // max: one warm Vercel instance can handle overlapping work (auth middleware query,
  // reserveRunningAutomationJob transaction, background job status update). With max: 1,
  // a second pool.connect() in the same instance waited indefinitely → 504 at maxDuration.
  max: isServerless ? 3 : 10,

  // connectionTimeoutMillis: if all pool slots are busy, fail after 8s with an error
  // instead of waiting silently until Vercel kills the whole function at 60s (504).
  connectionTimeoutMillis: isServerless ? 8_000 : 10_000,

  idleTimeoutMillis: isServerless ? 5_000 : 30_000,
  allowExitOnIdle: isServerless,
});
