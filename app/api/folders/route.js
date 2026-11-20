import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const folders = await sql`
    SELECT f.id, f.name, f.name_en, f.name_my, f.description, f.description_en, f.description_my,
           f.cover_url, f.position, f.orderable,
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

  const {
    name, nameEn, nameMy,
    description, descriptionEn, descriptionMy,
    orderable, orderFormType, dessertOptions, minQuantity,
  } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const cleanFormType = orderFormType === "dessert" ? "dessert" : "cake";

  const cleanDessertOptions = Array.isArray(dessertOptions)
    ? dessertOptions
        .map((o) => ({ label: String(o.label || "").trim(), price: Number(o.price) || 0 }))
        .filter((o) => o.label)
    : [];

  const cleanMinQuantity =
    Number.isFinite(Number(minQuantity)) && Number(minQuantity) > 0
      ? Math.floor(Number(minQuantity))
      : 6;

  const posRows = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM folders`;
  const nextPosition = posRows[0].next;

  const rows = await sql`
    INSERT INTO folders (
      name, name_en, name_my, description, description_en, description_my,
      position, orderable, order_form_type, dessert_options, dessert_min_quantity
    )
    VALUES (
      ${name.trim()}, ${nameEn?.trim() || null}, ${nameMy?.trim() || null},
      ${description || null}, ${descriptionEn?.trim() || null}, ${descriptionMy?.trim() || null},
      ${nextPosition}, ${orderable === false ? false : true},
      ${cleanFormType}, ${JSON.stringify(cleanDessertOptions)}, ${cleanMinQuantity}
    )
    RETURNING *
  `;

  return NextResponse.json({ folder: rows[0] }, { status: 201 });
}
