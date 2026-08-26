import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/require-auth";
import cloudinary from "@/lib/cloudinary";

// Admin-only. Same signed-upload pattern as /api/upload-sign, just its own
// Cloudinary folder so hero images stay separate from album photos.
export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const cloudinaryFolder = "memory-cake/hero-slides";
  const transformation = "c_limit,w_2500,q_auto:good";

  const paramsToSign = { timestamp, folder: cloudinaryFolder, transformation };

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
