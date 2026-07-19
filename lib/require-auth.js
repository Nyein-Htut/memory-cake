import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

// Returns true if the current request has a valid admin session cookie.
// Use this at the top of any API route that creates/edits/deletes data.
export async function isAdminAuthed() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const payload = await verifySessionToken(token);
  return !!payload;
}
