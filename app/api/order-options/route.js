import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`SELECT sizes, flavors, fillings FROM order_options WHERE id = 1`;
  const options = rows[0] || { sizes: [], flavors: [], fillings: [] };
  return NextResponse.json({ options });
}

export async function PATCH(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sizes, flavors, fillings } = await request.json();

  if (!Array.isArray(sizes) || !Array.isArray(flavors) || !Array.isArray(fillings)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cleanSizes = sizes
    .map((s) => ({ label: String(s.label || "").trim(), price: Number(s.price) || 0 }))
    .filter((s) => s.label);
  const cleanFlavors = flavors
    .map((f) => ({ label: String(f.label || "").trim(), imageUrl: f.imageUrl || null }))
    .filter((f) => f.label);
  const cleanFillings = fillings
    .map((f) => ({ label: String(f.label || "").trim(), imageUrl: f.imageUrl || null }))
    .filter((f) => f.label);

  const rows = await sql`
    INSERT INTO order_options (id, sizes, flavors, fillings, updated_at)
    VALUES (1, ${JSON.stringify(cleanSizes)}, ${JSON.stringify(cleanFlavors)}, ${JSON.stringify(cleanFillings)}, now())
    ON CONFLICT (id) DO UPDATE SET
      sizes = EXCLUDED.sizes,
      flavors = EXCLUDED.flavors,
      fillings = EXCLUDED.fillings,
      updated_at = now()
    RETURNING sizes, flavors, fillings
  `;

  return NextResponse.json({ options: rows[0] });
}
