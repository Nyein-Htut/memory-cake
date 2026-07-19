import { neon } from "@neondatabase/serverless";

// Reuses a single tagged-template SQL client across requests.
// Neon's serverless driver is HTTP-based, so this is safe in serverless environments.
export const sql = neon(process.env.DATABASE_URL);
