import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";
import { pushToCustomer } from "@/lib/push";

const VALID_STATUSES = ["new", "confirmed", "done", "cancelled"];

const STATUS_TEXT = {
  confirmed: "已确认 · Your order is confirmed ✅",
  done: "已完成 · Your order is ready 🎂",
  cancelled: "已取消 · Your order was cancelled",
  new: "订单状态已更新 · Order status updated",
};

// PATCH /api/orders/123  body: { status }   (admin only)
export async function PATCH(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const before = await sql`SELECT status FROM orders WHERE id = ${id}`;
  if (before.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await sql`
    UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *
  `;
  const order = rows[0];

  if (before[0].status !== status) {
    await pushToCustomer(order.phone, {
      title: `Memory Cake · Order #${order.id}`,
      body: STATUS_TEXT[status] || STATUS_TEXT.new,
      url: "/orders",
      tag: `order-status-${order.id}`,
    });
  }

  return NextResponse.json({ order });
}

// DELETE /api/orders/123   (admin only)
export async function DELETE(request, { params }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  await sql`DELETE FROM orders WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
