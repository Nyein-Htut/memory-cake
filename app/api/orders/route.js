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
    sizeLabel,
    sizePrice,
    flavor,
    filling,
    deliveryDate,
    deliveryTime,
    deliveryPlace,
    phone,
    remark,
  } = body;

  if (!sizeLabel || !deliveryPlace || !phone) {
    return NextResponse.json({ error: "缺少必填信息" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO orders (
      photo_id, folder_id, photo_url, folder_name,
      size_label, size_price, flavor, filling,
      delivery_date, delivery_time, delivery_place, phone, remark
    ) VALUES (
      ${photoId || null}, ${folderId || null}, ${photoUrl || null}, ${folderName || null},
      ${sizeLabel}, ${sizePrice || null}, ${flavor || null}, ${filling || null},
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

  return NextResponse.json({ orders });
}
