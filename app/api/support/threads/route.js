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
      phone,
      MAX(created_at) AS last_message_at,
      (ARRAY_AGG(COALESCE(message, '📎 Attachment') ORDER BY created_at DESC))[1] AS last_message,
      COUNT(*) FILTER (WHERE sender = 'customer' AND read_by_admin = FALSE)::int AS unread_count
    FROM support_messages
    GROUP BY phone
    ORDER BY last_message_at DESC
  `;

  return NextResponse.json({ threads });
}
