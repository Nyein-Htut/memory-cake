import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";
import cloudinary from "@/lib/cloudinary";

export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const { caption } = await request.json();

  const rows = await sql`
    UPDATE photos SET caption = ${caption || null} WHERE id = ${id} RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ photo: rows[0] });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);

  const rows = await sql`SELECT * FROM photos WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const photo = rows[0];

  await cloudinary.uploader.destroy(photo.public_id).catch(() => null);
  await sql`DELETE FROM photos WHERE id = ${id}`;

  // If this was the folder's cover photo, pick a new one (or clear it).
  const folderRows = await sql`SELECT cover_url FROM folders WHERE id = ${photo.folder_id}`;
  if (folderRows[0]?.cover_url === photo.url) {
    const remaining = await sql`
      SELECT url FROM photos WHERE folder_id = ${photo.folder_id} ORDER BY created_at ASC LIMIT 1
    `;
    await sql`
      UPDATE folders SET cover_url = ${remaining[0]?.url || null} WHERE id = ${photo.folder_id}
    `;
  }

  return NextResponse.json({ ok: true });
}
