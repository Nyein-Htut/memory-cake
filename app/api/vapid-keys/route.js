import { NextResponse } from "next/server";
import webpush from "web-push";
import { isAdminAuthed } from "@/lib/require-auth";

// TEMPORARY — delete this file right after you copy the keys.
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(webpush.generateVAPIDKeys());
}
