import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// Admin-only. Lists every customer with an open support conversation,
// most recently active first, with an unread count for the badge.
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await sql`
    SELECT
      sm.phone,
      MAX(sm.created_at) AS last_message_at,
      (ARRAY_AGG(COALESCE(sm.message, '📎 Attachment') ORDER BY sm.created_at DESC))[1] AS last_message,
      COUNT(*) FILTER (WHERE sm.sender = 'customer' AND sm.read_by_admin = FALSE)::int AS unread_count,
      (
        SELECT o.wechat_name
        FROM orders o
        WHERE o.phone = sm.phone AND o.wechat_name IS NOT NULL
        ORDER BY o.created_at DESC
        LIMIT 1
      ) AS wechat_name
    FROM support_messages sm
    GROUP BY sm.phone
    ORDER BY last_message_at DESC
  `;

  return NextResponse.json({ threads });
}
