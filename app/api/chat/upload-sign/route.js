import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// Public — both customers and the admin need this to attach images
// (receipts, payment QR codes, etc.) directly from a chat window.
// Deliberately not behind isAdminAuthed since customers have no login.
export async function POST() {
  const timestamp = Math.round(Date.now() / 1000);
  const cloudinaryFolder = "memory-cake/chat-attachments";
  const transformation = "c_limit,w_1600,q_auto:good";

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
