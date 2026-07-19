import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export async function GET() {
  const folders = await sql`
    SELECT f.id, f.name, f.description, f.cover_url, f.created_at,
           COUNT(p.id)::int AS photo_count
    FROM folders f
    LEFT JOIN photos p ON p.folder_id = f.id
    GROUP BY f.id
    ORDER BY f.created_at DESC
  `;
  return NextResponse.json({ folders });
}

export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO folders (name, description)
    VALUES (${name.trim()}, ${description || null})
    RETURNING *
  `;

  return NextResponse.json({ folder: rows[0] }, { status: 201 });
}
