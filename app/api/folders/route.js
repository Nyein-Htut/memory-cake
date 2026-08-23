import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export async function GET() {
  const folders = await sql`
    SELECT f.id, f.name, f.description, f.cover_url, f.position, f.orderable,
       f.order_form_type, f.dessert_options, f.dessert_min_quantity, f.created_at,
       COUNT(p.id)::int AS photo_count
    FROM folders f
    LEFT JOIN photos p ON p.folder_id = f.id
    GROUP BY f.id
    ORDER BY f.position ASC, f.created_at DESC
  `;
  return NextResponse.json({ folders });
}

export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, orderable, orderFormType } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const cleanFormType = orderFormType === "dessert" ? "dessert" : "cake";

  const posRows = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM folders`;
  const nextPosition = posRows[0].next;

  const rows = await sql`
    INSERT INTO folders (name, description, position, orderable, order_form_type)
    VALUES (${name.trim()}, ${description || null}, ${nextPosition}, ${orderable === false ? false : true}, ${cleanFormType})
    RETURNING *
  `;

  return NextResponse.json({ folder: rows[0] }, { status: 201 });
}
