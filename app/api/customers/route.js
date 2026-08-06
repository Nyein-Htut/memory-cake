import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// Admin-only. Every customer who has placed at least one order, one row
// per phone number, using their most recent WeChat name and most recent
// order date — most recently active first. Search/pagination (top 5 vs
// "see more") is handled client-side since this list is small.
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await sql`
    WITH ranked AS (
      SELECT
        phone,
        wechat_name,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) AS rn
      FROM orders
      WHERE phone IS NOT NULL AND phone <> ''
    )
    SELECT phone, wechat_name, created_at AS last_order_at
    FROM ranked
    WHERE rn = 1
    ORDER BY last_order_at DESC
  `;

  return NextResponse.json({ customers });
}
