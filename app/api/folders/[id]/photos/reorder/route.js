import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// PATCH /api/folders/123/photos/reorder
// body: { orderedIds: [photoId, photoId, ...] } — new order for the photos
// currently loaded in the admin grid for this folder.
export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = Number(params.id);
  const { orderedIds } = await request.json();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { error: "orderedIds must be a non-empty array" },
      { status: 400 }
    );
  }

  // The folder_id check in the WHERE clause means a stray/forged id from
  // another folder just gets silently skipped rather than reordering
  // someone else's photos.
  await sql.transaction(
    orderedIds.map((id, index) =>
      sql`UPDATE photos SET position = ${index} WHERE id = ${Number(id)} AND folder_id = ${folderId}`
    )
  );

  return NextResponse.json({ ok: true });
}
