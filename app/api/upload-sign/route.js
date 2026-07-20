import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/require-auth";
import cloudinary from "@/lib/cloudinary";

// The admin's browser calls this first to get a short-lived, signed set of
// upload params, then uploads the file directly to Cloudinary (not through
// our server) using those params. Keeps large files off our own server.
export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await request.json();

  const timestamp = Math.round(Date.now() / 1000);
  const cloudinaryFolder = `memory-cake/${folderId || "misc"}`;

  // Applied to the file as it's stored in Cloudinary (not just on delivery).
  // Caps the original at 2500px wide and lets Cloudinary auto-pick a good
  // quality level — an 8MB phone photo typically comes out a few hundred KB,
  // and every thumbnail/derived version generated from it is smaller too.
  const transformation = "c_limit,w_2500,q_auto:good";

  const paramsToSign = {
    timestamp,
    folder: cloudinaryFolder,
    transformation,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: cloudinaryFolder,
    transformation,
  });
}
