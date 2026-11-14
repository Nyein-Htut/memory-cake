import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";
import { pushToAdmins, pushToCustomer } from "@/lib/push";

// General "contact admin" chat — not tied to any specific order.
// GET  /api/support/messages?phone=...&role=admin|customer
// POST /api/support/messages  body: { phone, message?, attachmentUrl?, attachmentType?, role }
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

  const preview = message?.trim() ? message.trim().slice(0, 80) : "📎 Attachment";

  if (sender === "customer") {
    const nameRows = await sql`
      SELECT wechat_name FROM orders
      WHERE phone = ${cleanPhone} AND wechat_name IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `;
    await pushToAdmins({
      title: `💬 客服消息 · ${nameRows[0]?.wechat_name || cleanPhone}`,
      body: preview,
      url: "/admin/support",
      tag: `support-${cleanPhone}`,
    });
  } else {
    await pushToCustomer(cleanPhone, {
      title: "Memory Cake",
      body: preview,
      url: "/notifications",
      tag: `support-${cleanPhone}`,
    });
  }

  return NextResponse.json({ message: rows[0] }, { status: 201 });
}
