import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Public. GET /api/notifications?phone=...
// Aggregates unread admin messages across the customer's general support
// chat and every order chat.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") || "").trim();

  if (!phone) {
    return NextResponse.json({ items: [], unreadCount: 0 });
  }

  const supportItems = await sql`
    SELECT id, 'support' AS type, NULL::int AS order_id, message, attachment_url, created_at
    FROM support_messages
    WHERE phone = ${phone} AND sender = 'admin' AND read_by_customer = FALSE
    ORDER BY created_at DESC
  `;

  const orderItems = await sql`
    SELECT m.id, 'order' AS type, m.order_id, m.message, m.attachment_url, m.created_at
    FROM order_messages m
    JOIN orders o ON o.id = m.order_id
    WHERE o.phone = ${phone} AND m.sender = 'admin' AND m.read_by_customer = FALSE
    ORDER BY m.created_at DESC
  `;

  const items = [...supportItems, ...orderItems].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return NextResponse.json({ items, unreadCount: items.length });
}
