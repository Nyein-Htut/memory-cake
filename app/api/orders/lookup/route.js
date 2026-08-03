import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public. GET /api/orders/lookup?phone=...
// This is how a customer finds "their" orders — there's no account system,
// so phone number (already required on every order) is the identifier.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") || "").trim();

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const orders = await sql`
    SELECT * FROM orders WHERE phone = ${phone} ORDER BY created_at DESC
  `;

  return NextResponse.json({ orders });
}
