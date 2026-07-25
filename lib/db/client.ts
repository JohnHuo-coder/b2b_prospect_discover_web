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
  // Allow a few concurrent queries per warm serverless instance (auth + reserve + background).
  max: isServerless ? 3 : 10,
  connectionTimeoutMillis: isServerless ? 8_000 : 10_000,
  idleTimeoutMillis: isServerless ? 5_000 : 30_000,
  allowExitOnIdle: isServerless,
});
