import { neon } from "@neondatabase/serverless";

// Next.js 14 patches fetch() with a data cache. Neon's driver runs every
// query through fetch, so without no-store, identical queries can return
// stale rows (deleted folders still showing, new ones missing).
export const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: { cache: "no-store" },
});
