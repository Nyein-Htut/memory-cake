import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// General "contact admin" chat — not tied to any specific order.
// GET  /api/support/messages?phone=...   (customer, or admin viewing a thread)
// POST /api/support/messages  body: { phone, message?, attachmentUrl?, attachmentType? }
export async function GET(request) {
  const admin = await isAdminAuthed();
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") || "").trim();

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const messages = await sql`
    SELECT * FROM support_messages WHERE phone = ${phone} ORDER BY created_at ASC
  `;

  if (admin) {
    await sql`UPDATE support_messages SET read_by_admin = TRUE WHERE phone = ${phone} AND sender = 'customer'`;
  } else {
    await sql`UPDATE support_messages SET read_by_customer = TRUE WHERE phone = ${phone} AND sender = 'admin'`;
  }

  return NextResponse.json({ messages });
}

export async function POST(request) {
  const admin = await isAdminAuthed();
  const { phone, message, attachmentUrl, attachmentType } = await request.json();

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
