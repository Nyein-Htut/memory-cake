import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";
import cloudinary from "@/lib/cloudinary";

// Now supports ?limit=&offset= so the admin folder page can page through
// photos instead of loading the entire album at once.
export async function GET(request, { params }) {
  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const folders = await sql`SELECT * FROM folders WHERE id = ${id}`;
  if (folders.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await sql`
    SELECT * FROM photos WHERE folder_id = ${id}
    ORDER BY created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalRows = await sql`
    SELECT COUNT(*)::int AS count FROM photos WHERE folder_id = ${id}
  `;
  const total = totalRows[0].count;

  return NextResponse.json({
    folder: folders[0],
    photos,
    total,
    hasMore: offset + photos.length < total,
  });
}

export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const { name, description } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const rows = await sql`
    UPDATE folders
    SET name = ${name.trim()}, description = ${description || null}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ folder: rows[0] });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);

  // Clean up the photos on Cloudinary too, not just the database rows.
  const photos = await sql`SELECT public_id FROM photos WHERE folder_id = ${id}`;
  await Promise.all(
    photos.map((p) =>
      cloudinary.uploader.destroy(p.public_id).catch(() => null)
    )
  );

  await sql`DELETE FROM folders WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
