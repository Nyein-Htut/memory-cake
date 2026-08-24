import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// PATCH /api/folders/123/order-form
// body: { dessertOptions: [{ label, price }, ...], minQuantity: 6 }
export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const { dessertOptions, minQuantity } = await request.json();

  if (!Array.isArray(dessertOptions)) {
    return NextResponse.json({ error: "dessertOptions must be an array" }, { status: 400 });
  }

  const clean = dessertOptions
    .map((o) => ({ label: String(o.label || "").trim(), price: Number(o.price) || 0 }))
    .filter((o) => o.label);

  const cleanMinQuantity =
    Number.isFinite(Number(minQuantity)) && Number(minQuantity) > 0
      ? Math.floor(Number(minQuantity))
      : 6;

  const rows = await sql`
    UPDATE folders
    SET dessert_options = ${JSON.stringify(clean)},
        dessert_min_quantity = ${cleanMinQuantity},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ folder: rows[0] });
}
