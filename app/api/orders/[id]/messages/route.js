import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// GET  /api/orders/123/messages?phone=...   (customer)
// GET  /api/orders/123/messages              (admin, cookie)
// POST /api/orders/123/messages  body: { phone?, message?, attachmentUrl?, attachmentType? }
export async function GET(request, { params }) {
  const id = Number(params.id);
  const admin = await isAdminAuthed();

  const order = (await sql`SELECT id, phone FROM orders WHERE id = ${id}`)[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!admin) {
    const { searchParams } = new URL(request.url);
    const phone = (searchParams.get("phone") || "").trim();
    if (!phone || phone !== order.phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const messages = await sql`
    SELECT * FROM order_messages WHERE order_id = ${id} ORDER BY created_at ASC
  `;

  if (admin) {
    await sql`UPDATE order_messages SET read_by_admin = TRUE WHERE order_id = ${id} AND sender = 'customer'`;
  } else {
    await sql`UPDATE order_messages SET read_by_customer = TRUE WHERE order_id = ${id} AND sender = 'admin'`;
  }

  return NextResponse.json({ messages });
}

export async function POST(request, { params }) {
  const id = Number(params.id);
  const admin = await isAdminAuthed();
  const { phone, message, attachmentUrl, attachmentType } = await request.json();

  if (!message?.trim() && !attachmentUrl) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const order = (await sql`SELECT id, phone FROM orders WHERE id = ${id}`)[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let sender = "customer";
  if (admin) {
    sender = "admin";
  } else if (!phone || phone.trim() !== order.phone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    INSERT INTO order_messages (order_id, sender, message, attachment_url, attachment_type, read_by_admin, read_by_customer)
    VALUES (
      ${id}, ${sender}, ${message?.trim() || null}, ${attachmentUrl || null}, ${attachmentType || null},
      ${sender === "admin"}, ${sender === "customer"}
    )
    RETURNING *
  `;

  return NextResponse.json({ message: rows[0] }, { status: 201 });
}
