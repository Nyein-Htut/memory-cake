import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const {
    photoId,
    folderId,
    photoUrl,
    folderName,
    wechatName,
    sizeLabel,
    sizePrice,
    flavor,
    filling1,
    filling2,
    quantity,
    deliveryDate,
    deliveryTime,
    deliveryPlace,
    phone,
    remark,
  } = body;

  if (!wechatName || !sizeLabel || !deliveryPlace || !phone) {
    return NextResponse.json({ error: "缺少必填信息" }, { status: 400 });
  }

  const cleanQuantity =
    Number.isFinite(Number(quantity)) && Number(quantity) > 0
      ? Math.floor(Number(quantity))
      : 1;

  // Re-check the folder's minimum server-side — never trust the client alone.
  if (folderId) {
    const folderRows = await sql`
      SELECT order_form_type, dessert_min_quantity FROM folders WHERE id = ${folderId}
    `;
    const folder = folderRows[0];
    if (folder?.order_form_type === "dessert") {
      const minQty = folder.dessert_min_quantity || 6;
      if (cleanQuantity < minQty) {
        return NextResponse.json(
          { error: `此甜品最少需要订购 ${minQty} 份，请修改数量后重新提交` },
          { status: 400 }
        );
      }
    }
  }

  const rows = await sql`
    INSERT INTO orders (
      photo_id, folder_id, photo_url, folder_name, wechat_name,
      size_label, size_price, flavor, filling1, filling2, quantity,
      delivery_date, delivery_time, delivery_place, phone, remark
    ) VALUES (
      ${photoId || null}, ${folderId || null}, ${photoUrl || null}, ${folderName || null}, ${wechatName.trim()},
      ${sizeLabel}, ${sizePrice || null}, ${flavor || null}, ${filling1 || null}, ${filling2 || null}, ${cleanQuantity},
      ${deliveryDate || null}, ${deliveryTime || null}, ${deliveryPlace}, ${phone}, ${remark || null}
    )
    RETURNING *
  `;

  return NextResponse.json({ order: rows[0] }, { status: 201 });
}

export async function GET(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = status
    ? await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`
    : await sql`SELECT * FROM orders ORDER BY created_at DESC`;

  if (!status || status === "new") {
    await sql`
      UPDATE orders SET seen_by_admin = TRUE
      WHERE status = 'new' AND seen_by_admin = FALSE
    `;
  }

  return NextResponse.json({ orders });
}
