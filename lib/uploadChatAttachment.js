// Shared by both the customer and admin chat UIs — uploads a file straight
// to Cloudinary (same signed-upload pattern as product photos) and returns
// a URL to attach to a chat message. PDFs (e.g. receipts) go up as "raw",
// images get Cloudinary's image pipeline (and the transformation cap).
export async function uploadChatAttachment(file) {
  const signRes = await fetch("/api/chat/upload-sign", { method: "POST" });
  if (!signRes.ok) throw new Error("Could not get upload permission");

  const { timestamp, signature, apiKey, cloudName, folder, transformation } =
    await signRes.json();

  const isImage = file.type.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);
  if (isImage) formData.append("transformation", transformation);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Upload failed");
  }

  const uploaded = await uploadRes.json();
  return { url: uploaded.secure_url, type: isImage ? "image" : "file" };
}
