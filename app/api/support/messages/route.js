import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// General "contact admin" chat — not tied to any specific order.
// GET  /api/support/messages?phone=...&role=admin|customer
// POST /api/support/messages  body: { phone, message?, attachmentUrl?, attachmentType?, role }
//
// `role` is what the caller CLAIMS to be. We only ever actually trust
// "admin" if isAdminAuthed() also passes — this stops an admin session
// cookie (e.g. from testing in the same browser) from silently hijacking
// messages sent from the customer-facing chat widget.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") || "").trim();
  const roleParam = searchParams.get("role");
  const admin = roleParam === "admin" && (await isAdminAuthed());

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const messages = await sql`
    SELECT * FROM support_messages WHERE phone = ${phone} ORDER BY created_at ASC
  `;

  // Support chat isn't tied to a specific order, but we can still label the
  // customer by their most recent WeChat name (from any order they placed
  // with this phone number) instead of a generic "Customer" label.
  let customerName = null;
  if (admin) {
    const nameRows = await sql`
      SELECT wechat_name FROM orders
      WHERE phone = ${phone} AND wechat_name IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `;
    customerName = nameRows[0]?.wechat_name || null;
  }

  if (admin) {
    await sql`UPDATE support_messages SET read_by_admin = TRUE WHERE phone = ${phone} AND sender = 'customer'`;
  } else {
    await sql`UPDATE support_messages SET read_by_customer = TRUE WHERE phone = ${phone} AND sender = 'admin'`;
  }

  return NextResponse.json({ messages, customerName });
}

export async function POST(request) {
  const { phone, message, attachmentUrl, attachmentType, role } = await request.json();
  const admin = role === "admin" && (await isAdminAuthed());

  const cleanPhone = (phone || "").trim();
  if (!cleanPhone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (!message?.trim() && !attachmentUrl) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const sender = admin ? "admin" : "customer";

  const rows = await sql`
    INSERT INTO support_messages (phone, sender, message, attachment_url, attachment_type, read_by_admin, read_by_customer)
    VALUES (
      ${cleanPhone}, ${sender}, ${message?.trim() || null}, ${attachmentUrl || null}, ${attachmentType || null},
      ${sender === "admin"}, ${sender === "customer"}
    )
    RETURNING *
  `;

  return NextResponse.json({ message: rows[0] }, { status: 201 });
}
