import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Customer-initiated cancellation. No admin cookie — instead the caller
// must supply the phone number on the order (same identifier used for
// lookup). The 24h rule is enforced here, server-side, not just in the UI.
export async function POST(request, { params }) {
  const id = Number(params.id);
  const { phone } = await request.json();

  if (!phone || !phone.trim()) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  const order = rows[0];

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.phone !== phone.trim()) {
    return NextResponse.json({ error: "Phone number does not match this order" }, { status: 403 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });
  }
  if (order.status === "done") {
    return NextResponse.json(
      { error: "This order has already been completed and can't be cancelled" },
      { status: 400 }
    );
  }

  if (order.delivery_date) {
    const deliveryAt = new Date(`${order.delivery_date}T${order.delivery_time || "00:00"}:00`);
    if (!Number.isNaN(deliveryAt.getTime())) {
      const hoursUntilDelivery = (deliveryAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDelivery < 24) {
        return NextResponse.json(
          { error: "Orders can't be cancelled within 24 hours of the delivery time. Please message us instead." },
          { status: 400 }
        );
      }
    }
  }

  const updated = await sql`
    UPDATE orders SET status = 'cancelled' WHERE id = ${id} RETURNING *
  `;

  return NextResponse.json({ order: updated[0] });
}
