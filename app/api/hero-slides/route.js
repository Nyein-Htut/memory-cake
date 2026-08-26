import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

// GET: the public homepage only ever needs active slides, in order.
// The admin page passes ?all=1 to see disabled ones too (auth-gated).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";

  if (all && !(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slides = all
    ? await sql`SELECT * FROM hero_slides ORDER BY position ASC, created_at ASC`
    : await sql`SELECT * FROM hero_slides WHERE active = TRUE ORDER BY position ASC, created_at ASC`;

  return NextResponse.json({ slides });
}

export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, publicId } = await request.json();
  if (!url || !publicId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const posRows = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM hero_slides`;
  const nextPosition = posRows[0].next;

  const rows = await sql`
    INSERT INTO hero_slides (url, public_id, position)
    VALUES (${url}, ${publicId}, ${nextPosition})
    RETURNING *
  `;

  return NextResponse.json({ slide: rows[0] }, { status: 201 });
}
