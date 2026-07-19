"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";

export default function AdminFolderPage({ params }) {
  const folderId = Number(params.id);
  const fileInputRef = useRef(null);

  const [folder, setFolder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");

  async function loadData() {
    setLoading(true);
    const res = await fetch(`/api/folders/${folderId}`);
    if (res.ok) {
      const data = await res.json();
      setFolder(data.folder);
      setPhotos(data.photos || []);
      setNameDraft(data.folder.name);
      setDescDraft(data.folder.description || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  async function handleSaveFolderInfo() {
    if (!nameDraft.trim()) return;
    await fetch(`/api/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft.trim(), description: descDraft }),
    });
    setEditingName(false);
    loadData();
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      // Get one signature; it's valid for a short window so we reuse it
      // for all files in this batch.
      const signRes = await fetch("/api/upload-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      if (!signRes.ok) throw new Error("Could not get upload permission");
      const { timestamp, signature, apiKey, cloudName, folder: cloudFolder } =
        await signRes.json();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", cloudFolder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Upload failed for ${file.name}`);
        }

        const uploaded = await uploadRes.json();

        await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderId,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            width: uploaded.width,
            height: uploaded.height,
          }),
        });
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Something went wrong while uploading");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveCaption(photoId) {
    await fetch(`/api/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: captionDraft }),
    });
    setEditingCaptionId(null);
    loadData();
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminHeader />
        <p className="max-w-5xl mx-auto px-6 py-10 text-cocoa-400">Loading...</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminHeader />
        <p className="max-w-5xl mx-auto px-6 py-10 text-cocoa-400">Folder not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/admin/dashboard"
          className="text-sm text-cocoa-400 hover:text-cocoa-700 transition-colors"
        >
          &larr; All albums
        </Link>

        <div className="mt-4 mb-8">
          {editingName ? (
            <div className="space-y-2 max-w-lg">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full rounded-lg border border-cocoa-200 px-3 py-2 font-serif text-xl focus:outline-none focus:ring-2 focus:ring-cocoa-500"
              />
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveFolderInfo}
                  className="rounded-lg bg-cocoa-800 text-cream px-4 py-1.5 text-sm font-medium hover:bg-cocoa-900"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-sm text-cocoa-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif font-medium text-3xl text-cocoa-900">{folder.name}</h1>
                {folder.description && (
                  <p className="text-cocoa-500 mt-1">{folder.description}</p>
                )}
              </div>
              <button
                onClick={() => setEditingName(true)}
                className="text-sm text-cocoa-500 hover:text-cocoa-800 whitespace-nowrap"
              >
                Edit info
              </button>
            </div>
          )}
        </div>

        <div className="mb-10 border-2 border-dashed border-cocoa-200 rounded-2xl p-8 text-center bg-white">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
            id="photo-upload"
            disabled={uploading}
          />
          <label
            htmlFor="photo-upload"
            className={`inline-block rounded-lg bg-cocoa-800 text-cream px-5 py-2.5 font-medium cursor-pointer hover:bg-cocoa-900 transition-colors ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploading ? uploadProgress || "Uploading..." : "Upload Photos"}
          </label>
          <p className="text-xs text-cocoa-400 mt-2">
            You can select multiple photos at once.
          </p>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        {photos.length === 0 ? (
          <p className="text-cocoa-400">No photos in this album yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl overflow-hidden bg-white border border-cocoa-100 shadow-card"
              >
                <div className="relative aspect-square bg-cocoa-100">
                  <Image
                    src={photo.url}
                    alt={photo.caption || "photo"}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-2.5">
                  {editingCaptionId === photo.id ? (
                    <div className="space-y-1.5">
                      <input
                        autoFocus
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        placeholder="Caption (optional)"
                        className="w-full text-xs rounded-md border border-cocoa-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                      />
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleSaveCaption(photo.id)}
                          className="text-cocoa-700 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCaptionId(null)}
                          className="text-cocoa-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-cocoa-500 truncate">
                        {photo.caption || "No caption"}
                      </p>
                      <div className="flex gap-2 text-xs shrink-0">
                        <button
                          onClick={() => {
                            setEditingCaptionId(photo.id);
                            setCaptionDraft(photo.caption || "");
                          }}
                          className="text-cocoa-500 hover:text-cocoa-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
