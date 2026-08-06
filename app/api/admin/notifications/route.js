import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newOrdersRows = await sql`
    SELECT COUNT(*)::int AS count FROM orders WHERE status = 'new' AND seen_by_admin = FALSE
  `;
  const unreadSupportRows = await sql`
    SELECT COUNT(*)::int AS count FROM support_messages WHERE sender = 'customer' AND read_by_admin = FALSE
  `;
  const unreadOrderChatRows = await sql`
    SELECT COUNT(*)::int AS count FROM order_messages WHERE sender = 'customer' AND read_by_admin = FALSE
  `;

  return NextResponse.json({
    newOrders: newOrdersRows[0].count,
    unreadSupportMessages: unreadSupportRows[0].count,
    unreadOrderMessages: unreadOrderChatRows[0].count,
  });
}
