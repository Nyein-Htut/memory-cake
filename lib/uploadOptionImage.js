// Uploads a flavor/filling reference photo straight to Cloudinary, reusing
// the same signed-upload pattern as product photos (see /api/upload-sign).
// Used only by the admin settings page.
export async function uploadOptionImage(file) {
  const signRes = await fetch("/api/upload-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId: "options" }),
  });

  if (!signRes.ok) throw new Error("Could not get upload permission");

  const { timestamp, signature, apiKey, cloudName, folder, transformation } =
    await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("transformation", transformation);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Image upload failed");
  }

  const uploaded = await uploadRes.json();
  return uploaded.secure_url;
}
