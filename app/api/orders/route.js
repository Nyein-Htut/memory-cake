import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";
import { pushToAdmins } from "@/lib/push";

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
    township,
    deliveryPlace,
    phone,
    remark,
  } = body;

  if (!wechatName || !sizeLabel || !deliveryPlace || !phone) {
    return NextResponse.json({ error: "缺少必填信息" }, { status: 400 });
  }
  if (!township) {
    return NextResponse.json({ error: "请选择配送区域" }, { status: 400 });
  }

  const cleanQuantity =
    Number.isFinite(Number(quantity)) && Number(quantity) > 0
      ? Math.floor(Number(quantity))
      : 1;

  // Re-check the folder's minimum server-side — never trust the client alone.
  let folder = null;
  if (folderId) {
    const folderRows = await sql`
      SELECT order_form_type, dessert_min_quantity, dessert_options FROM folders WHERE id = ${folderId}
    `;
    folder = folderRows[0] || null;
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

  // Delivery fee + item price come from the database, not the browser.
  const optionRows = await sql`SELECT sizes, townships FROM order_options WHERE id = 1`;
  const savedTownships = optionRows[0]?.townships || [];
  const matchedTownship = savedTownships.find((t) => t.label === township);

  if (!matchedTownship) {
    return NextResponse.json(
      { error: "该区域暂不支持配送，请选择可配送的区域" },
      { status: 400 }
    );
  }

  const deliveryFee = Math.max(0, Number(matchedTownship.fee) || 0);

  const priceList =
    folder?.order_form_type === "dessert" ? folder.dessert_options || [] : optionRows[0]?.sizes || [];
  const listedItem = priceList.find((o) => o.label === sizeLabel);
  const unitPrice = listedItem ? Number(listedItem.price) || 0 : Number(sizePrice) || 0;
  const totalPrice = unitPrice * cleanQuantity + deliveryFee;

  const rows = await sql`
    INSERT INTO orders (
      photo_id, folder_id, photo_url, folder_name, wechat_name,
      size_label, size_price, flavor, filling1, filling2, quantity,
      delivery_date, delivery_time, township, delivery_place, phone, remark,
      delivery_fee, total_price
    ) VALUES (
      ${photoId || null}, ${folderId || null}, ${photoUrl || null}, ${folderName || null}, ${wechatName.trim()},
      ${sizeLabel}, ${unitPrice || null}, ${flavor || null}, ${filling1 || null}, ${filling2 || null}, ${cleanQuantity},
      ${deliveryDate || null}, ${deliveryTime || null}, ${matchedTownship.label}, ${deliveryPlace}, ${phone}, ${remark || null},
      ${deliveryFee}, ${totalPrice}
    )
    RETURNING *
  `;

  const order = rows[0];

  // Must be awaited — on Vercel the function stops once the response is sent.
  await pushToAdmins({
    title: "🎂 新订单",
    body: `${wechatName.trim()} · ${sizeLabel}${cleanQuantity > 1 ? ` × ${cleanQuantity}` : ""} · ${matchedTownship.label} · MMK ${totalPrice.toLocaleString("en-US")}${
      deliveryDate ? ` · ${deliveryDate}` : ""
    }`,
    url: "/admin/orders",
    tag: `order-${order.id}`,
  });

  return NextResponse.json({ order }, { status: 201 });
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
