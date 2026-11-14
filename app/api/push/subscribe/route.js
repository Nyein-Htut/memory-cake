import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthed } from "@/lib/require-auth";

export async function POST(request) {
  const { subscription, role, phone } = await request.json();

  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  let finalRole = "customer";
  let finalPhone = (phone || "").trim();

  if (role === "admin") {
    if (!(await isAdminAuthed())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    finalRole = "admin";
    finalPhone = "";
  } else if (!finalPhone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  await sql`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, role, phone)
    VALUES (${endpoint}, ${p256dh}, ${auth}, ${finalRole}, ${finalPhone || null})
    ON CONFLICT (endpoint) DO UPDATE SET
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      role = EXCLUDED.role,
      phone = EXCLUDED.phone
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { endpoint } = await request.json();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
  return NextResponse.json({ ok: true });
}
