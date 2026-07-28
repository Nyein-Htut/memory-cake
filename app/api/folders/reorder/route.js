import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// PATCH /api/folders/reorder
// body: { orderedIds: [folderId, folderId, ...] } — the FULL list of folder
// ids in their new display order. Each id's index in the array becomes its
// new position.
export async function PATCH(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderedIds } = await request.json();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { error: "orderedIds must be a non-empty array" },
      { status: 400 }
    );
  }

  // Neon's HTTP driver doesn't share a transaction across separate query
  // calls, so batch all the position updates with sql.transaction to keep
  // this atomic (either the whole new order lands, or none of it does).
  await sql.transaction(
    orderedIds.map((id, index) =>
      sql`UPDATE folders SET position = ${index} WHERE id = ${Number(id)}`
    )
  );

  return NextResponse.json({ ok: true });
}
