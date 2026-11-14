import webpush from "web-push";
import { sql } from "@/lib/db";

let configured = false;

function configure() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    pub,
    priv
  );
  configured = true;
  return true;
}

async function sendToRows(rows, payload) {
  if (!configured && !configure()) return;
  if (!rows.length) return;

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    rows.map((row) =>
      webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        body
      )
    )
  );

  // Clean out subscriptions that are gone (uninstalled / permission revoked).
  const dead = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const code = r.reason?.statusCode;
      if (code === 404 || code === 410) dead.push(rows[i].endpoint);
    }
  });
  for (const endpoint of dead) {
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`.catch(() => null);
  }
}

// Never throws — a failed notification must never break an order or a chat message.
export async function pushToAdmins(payload) {
  try {
    const rows = await sql`
      SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE role = 'admin'
    `;
    await sendToRows(rows, payload);
  } catch (err) {
    console.error("pushToAdmins failed:", err?.message);
  }
}

export async function pushToCustomer(phone, payload) {
  try {
    const clean = (phone || "").trim();
    if (!clean) return;
    const rows = await sql`
      SELECT endpoint, p256dh, auth FROM push_subscriptions
      WHERE role = 'customer' AND phone = ${clean}
    `;
    await sendToRows(rows, payload);
  } catch (err) {
    console.error("pushToCustomer failed:", err?.message);
  }
}
