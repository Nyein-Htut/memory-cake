import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// TEMPORARY — delete once hero slides are confirmed working.
export async function GET() {
  try {
    const all = await sql`SELECT id, url, active, position, created_at FROM hero_slides ORDER BY position ASC`;
    return NextResponse.json({ count: all.length, slides: all });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
