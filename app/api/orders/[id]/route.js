import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

// GET  /api/orders/123/messages?role=admin
// GET  /api/orders/123/messages?role=customer&phone=...
// POST /api/orders/123/messages  body: { phone?, message?, attachmentUrl?, attachmentType?, role }
//
// `role` is what the caller CLAIMS to be. We only trust "admin" if
// isAdminAuthed() also passes — an admin session cookie present in the same
// browser as a customer chat window should never cause a customer's message
// to be stamped as sender: 'admin'.
export async function GET(request, { params }) {
  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");
  const admin = roleParam === "admin" && (await isAdminAuthed());

  const order = (await sql`SELECT id, phone FROM orders WHERE id = ${id}`)[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!admin) {
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
  const { phone, message, attachmentUrl, attachmentType, role } = await request.json();
  const admin = role === "admin" && (await isAdminAuthed());

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
