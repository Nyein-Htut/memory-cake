import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Public, read-only, paginated photo listing for one folder.
// GET /api/folders/123/photos?limit=24&offset=0
export async function GET(request, { params }) {
  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 24, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const photos = await sql`
    SELECT * FROM photos
    WHERE folder_id = ${id}
    ORDER BY created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalRows = await sql`
    SELECT COUNT(*)::int AS count FROM photos WHERE folder_id = ${id}
  `;
  const total = totalRows[0].count;

  return NextResponse.json({
    photos,
    total,
    hasMore: offset + photos.length < total,
  });
}
