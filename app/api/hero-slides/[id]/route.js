import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";
import cloudinary from "@/lib/cloudinary";

// PATCH toggles active/inactive — used by the switch in the admin grid.
export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const { active } = await request.json();

  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "active must be true or false" }, { status: 400 });
  }

  const rows = await sql`
    UPDATE hero_slides SET active = ${active} WHERE id = ${id} RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ slide: rows[0] });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);

  const rows = await sql`SELECT * FROM hero_slides WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await cloudinary.uploader.destroy(rows[0].public_id).catch(() => null);
  await sql`DELETE FROM hero_slides WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
