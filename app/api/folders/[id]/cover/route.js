import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// PATCH /api/folders/123/cover
// body: { url: "<cloudinary url of a photo already in this folder>" }
export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = Number(params.id);
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Confirm the photo actually belongs to this folder before using it as
  // the cover — stops the cover being pointed at an arbitrary URL.
  const owned = await sql`
    SELECT 1 FROM photos WHERE folder_id = ${folderId} AND url = ${url} LIMIT 1
  `;
  if (owned.length === 0) {
    return NextResponse.json({ error: "Photo not found in this folder" }, { status: 404 });
  }

  const rows = await sql`
    UPDATE folders SET cover_url = ${url}, updated_at = now()
    WHERE id = ${folderId}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ folder: rows[0] });
}
