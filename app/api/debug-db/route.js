import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// TEMPORARY DIAGNOSTIC ROUTE — delete this file once the folders-not-showing
// issue is fixed. It reveals (a masked version of) which database host this
// deployment is actually connected to, and (b) what it sees when it queries
// the folders table directly, exactly the way the homepage does.
export async function GET() {
  const rawUrl = process.env.DATABASE_URL || "NOT SET";

  // Mask the password but keep the host/db name visible for comparison.
  let maskedUrl = "NOT SET";
  try {
    const u = new URL(rawUrl);
    maskedUrl = `${u.protocol}//${u.username}:****@${u.host}${u.pathname}${u.search}`;
  } catch {
    maskedUrl = "COULD NOT PARSE DATABASE_URL";
  }

  let folders = null;
  let currentDb = null;
  let queryError = null;

  try {
    const dbInfo = await sql`SELECT current_database() AS db, inet_server_addr() AS server_ip`;
    currentDb = dbInfo[0];

    folders = await sql`SELECT id, name, created_at FROM folders ORDER BY created_at DESC`;
  } catch (err) {
    queryError = err.message;
  }

  return NextResponse.json({
    env: process.env.VERCEL_ENV || "unknown (not on Vercel?)",
    maskedDatabaseUrl: maskedUrl,
    currentDatabase: currentDb,
    folderCount: folders ? folders.length : null,
    folders,
    queryError,
  });
}
