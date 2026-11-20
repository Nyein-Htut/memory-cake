import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`SELECT sizes, flavors, fillings, townships FROM order_options WHERE id = 1`;
  const options = rows[0] || { sizes: [], flavors: [], fillings: [], townships: [] };
  return NextResponse.json({ options });
}

export async function PATCH(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sizes, flavors, fillings, townships } = await request.json();

  if (!Array.isArray(sizes) || !Array.isArray(flavors) || !Array.isArray(fillings)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cleanSizes = sizes
    .map((s) => ({
      label: String(s.label || "").trim(),
      labelEn: String(s.labelEn || "").trim(),
      labelMy: String(s.labelMy || "").trim(),
      price: Number(s.price) || 0,
    }))
    .filter((s) => s.label);
  const cleanFlavors = flavors
    .map((f) => ({
      label: String(f.label || "").trim(),
      labelEn: String(f.labelEn || "").trim(),
      labelMy: String(f.labelMy || "").trim(),
      imageUrl: f.imageUrl || null,
    }))
    .filter((f) => f.label);
  const cleanFillings = fillings
    .map((f) => ({
      label: String(f.label || "").trim(),
      labelEn: String(f.labelEn || "").trim(),
      labelMy: String(f.labelMy || "").trim(),
      imageUrl: f.imageUrl || null,
    }))
    .filter((f) => f.label);

  // Townships are optional in the payload: if omitted, the saved list is left alone.
  let townshipsJson = null;
  if (Array.isArray(townships)) {
    const seen = new Set();
    const cleanTownships = [];
    for (const t of townships) {
      const label = String(t.label || "").trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      cleanTownships.push({
        label,
        labelEn: String(t.labelEn || "").trim(),
        labelMy: String(t.labelMy || "").trim(),
        fee: Math.max(0, Math.floor(Number(t.fee) || 0)),
      });
    }
    townshipsJson = JSON.stringify(cleanTownships);
  }

  const rows = await sql`
    INSERT INTO order_options (id, sizes, flavors, fillings, townships, updated_at)
    VALUES (
      1, ${JSON.stringify(cleanSizes)}, ${JSON.stringify(cleanFlavors)}, ${JSON.stringify(cleanFillings)},
      COALESCE(${townshipsJson}::jsonb, '[]'::jsonb), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      sizes = EXCLUDED.sizes,
      flavors = EXCLUDED.flavors,
      fillings = EXCLUDED.fillings,
      townships = COALESCE(${townshipsJson}::jsonb, order_options.townships),
      updated_at = now()
    RETURNING sizes, flavors, fillings, townships
  `;

  return NextResponse.json({ options: rows[0] });
}
