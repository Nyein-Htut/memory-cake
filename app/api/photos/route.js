import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// Called by the admin's browser after a file has already been uploaded
// directly to Cloudinary (see /api/upload-sign). We just save the resulting
// URL + metadata into Postgres.
export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId, url, publicId, width, height, caption } = await request.json();

  if (!folderId || !url || !publicId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO photos (folder_id, url, public_id, width, height, caption)
    VALUES (${folderId}, ${url}, ${publicId}, ${width || null}, ${height || null}, ${caption || null})
    RETURNING *
  `;

  // If the folder has no cover photo yet, use this one.
  await sql`
    UPDATE folders
    SET cover_url = COALESCE(cover_url, ${url})
    WHERE id = ${folderId}
  `;

  return NextResponse.json({ photo: rows[0] }, { status: 201 });
}
