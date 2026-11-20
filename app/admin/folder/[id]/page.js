"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";
import { cldThumb } from "@/lib/cloudinary-url";
import { useDragReorder } from "@/lib/useDragReorder";

const PAGE_SIZE = 30;

export default function AdminFolderPage({ params }) {
  const folderId = Number(params.id);
  const fileInputRef = useRef(null);

  const [folder, setFolder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameEnDraft, setNameEnDraft] = useState("");
  const [nameMyDraft, setNameMyDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [descEnDraft, setDescEnDraft] = useState("");
  const [descMyDraft, setDescMyDraft] = useState("");
  const [editOrderable, setEditOrderable] = useState(true);
  const [editFormType, setEditFormType] = useState("cake");
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionEnDraft, setCaptionEnDraft] = useState("");
  const [captionMyDraft, setCaptionMyDraft] = useState("");

  const [settingCoverId, setSettingCoverId] = useState(null);

  // Dessert folders carry a single price (the folder/photo IS the item).
  // Internally still saved as a one-item dessert_options array
  // (label = folder name) so the order form / receipt code doesn't change.
  const [dessertPrice, setDessertPrice] = useState("");
  const [minQuantity, setMinQuantity] = useState(6);
  const [savingDessertOptions, setSavingDessertOptions] = useState(false);
  const [dessertSaveMsg, setDessertSaveMsg] = useState("");

  const { draggingId, handlePointerDown, registerItemRef } = useDragReorder(
    photos,
    setPhotos,
    async (orderedIds) => {
      await fetch(`/api/folders/${folderId}/photos/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    }
  );

  async function loadData() {
    setLoading(true);

    const res = await fetch(`/api/folders/${folderId}?limit=${PAGE_SIZE}&offset=0`, { cache: "no-store" });

    if (res.ok) {
      const data = await res.json();

      setFolder(data.folder);
      setPhotos(data.photos || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setNameDraft(data.folder.name);
      setNameEnDraft(data.folder.name_en || "");
      setNameMyDraft(data.folder.name_my || "");
      setDescDraft(data.folder.description || "");
      setDescEnDraft(data.folder.description_en || "");
      setDescMyDraft(data.folder.description_my || "");
      setEditOrderable(data.folder.orderable !== false);
      setEditFormType(data.folder.order_form_type === "dessert" ? "dessert" : "cake");
      const existingPrice = data.folder.dessert_options?.[0]?.price;
      setDessertPrice(existingPrice ? String(existingPrice) : "");
      setMinQuantity(data.folder.dessert_min_quantity || 6);
    }

    setLoading(false);
  }

  async function loadMorePhotos() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const res = await fetch(`/api/folders/${folderId}/photos?limit=${PAGE_SIZE}&offset=${photos.length}`);

    if (res.ok) {
      const data = await res.json();
      setPhotos((prev) => [...prev, ...data.photos]);
      setTotal(data.total);
      setHasMore(data.hasMore);
    }

    setLoadingMore(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  async function handleSaveFolderInfo() {
    if (!nameDraft.trim()) {
      setError("请填写相册名称");
      return;
    }

    setSavingInfo(true);
    setError("");

    const res = await fetch(`/api/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameDraft.trim(),
        nameEn: nameEnDraft.trim(),
        nameMy: nameMyDraft.trim(),
        description: descDraft,
        descriptionEn: descEnDraft,
        descriptionMy: descMyDraft,
        orderable: editOrderable,
        orderFormType: editFormType,
      }),
    });

    setSavingInfo(false);

    if (!res.ok) {
      setError("Could not save folder info. Try again.");
      return;
    }

    setEditingName(false);
    loadData();
  }

  function updateDessertPrice(rawValue) {
    setDessertPrice(rawValue.replace(/[^0-9]/g, ""));
  }

  async function handleSaveDessertOptions() {
    setSavingDessertOptions(true);
    setDessertSaveMsg("");

    const price = Number(dessertPrice) || 0;

    const res = await fetch(`/api/folders/${folderId}/order-form`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dessertOptions: price > 0 ? [{ label: folder.name, price }] : [],
        minQuantity,
      }),
    });

    setSavingDessertOptions(false);

    if (res.ok) {
      setDessertSaveMsg("已保存");
      setTimeout(() => setDessertSaveMsg(""), 2000);
      loadData();
    } else {
      setDessertSaveMsg("保存失败，请重试");
    }
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    let failedCount = 0;

    try {
      const signRes = await fetch("/api/upload-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      if (!signRes.ok) {
        throw new Error("Could not get upload permission");
      }

      const { timestamp, signature, apiKey, cloudName, folder: cloudFolder, transformation } =
        await signRes.json();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        try {
          const formData = new FormData();

          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp);
          formData.append("signature", signature);
          formData.append("folder", cloudFolder);
          formData.append("transformation", transformation);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Cloudinary upload failed for ${file.name}`);
          }

          const uploaded = await uploadRes.json();

          const saveRes = await fetch("/api/photos", {
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

          if (!saveRes.ok) {
            const errData = await saveRes.json().catch(() => ({}));
            throw new Error(
              errData.error ||
                `Uploaded ${file.name} to Cloudinary, but could not save it to the album (server error).`
            );
          }
        } catch (fileErr) {
          failedCount += 1;
          setError((prev) =>
            prev ? `${prev} | ${fileErr.message}` : fileErr.message || "Something went wrong while uploading"
          );
        }
      }

      await loadData();

      if (failedCount === 0) setError("");
    } catch (err) {
      setError(err.message || "Something went wrong while uploading");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveCaption(photoId) {
    const res = await fetch(`/api/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: captionDraft, captionEn: captionEnDraft, captionMy: captionMyDraft }),
    });

    if (!res.ok) {
      setError("Could not save caption. Try again.");
      return;
    }

    setEditingCaptionId(null);
    loadData();
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });

    if (!res.ok) {
      setError("Could not delete photo. Try again.");
      return;
    }

    loadData();
  }

  async function handleSetCover(photo) {
    setSettingCoverId(photo.id);

    const res = await fetch(`/api/folders/${folderId}/cover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: photo.url }),
    });

    setSettingCoverId(null);

    if (!res.ok) {
      setError("Could not set cover photo. Try again.");
      return;
    }

    setFolder((prev) => (prev ? { ...prev, cover_url: photo.url } : prev));
  }

  function startEditingInfo() {
    setNameDraft(folder.name);
    setNameEnDraft(folder.name_en || "");
    setNameMyDraft(folder.name_my || "");
    setDescDraft(folder.description || "");
    setDescEnDraft(folder.description_en || "");
    setDescMyDraft(folder.description_my || "");
    setEditOrderable(folder.orderable !== false);
    setEditFormType(folder.order_form_type === "dessert" ? "dessert" : "cake");
    setEditingName(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminHeader />
        <p className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-cocoa-400">Loading...</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminHeader />
        <p className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-cocoa-400">Folder not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link href="/admin/dashboard" className="text-sm text-cocoa-400 hover:text-cocoa-700 transition-colors">
          &larr; All albums
        </Link>

        <div className="mt-4 mb-6 sm:mb-8">
          {editingName ? (
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="中文名称"
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2.5 font-serif text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />

                <input
                  value={nameEnDraft}
                  onChange={(e) => setNameEnDraft(e.target.value)}
                  placeholder="English name (optional)"
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />

                <input
                  value={nameMyDraft}
                  onChange={(e) => setNameMyDraft(e.target.value)}
                  placeholder="မြန်မာအမည် (optional)"
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />

                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />

                <textarea
                  value={descEnDraft}
                  onChange={(e) => setDescEnDraft(e.target.value)}
                  placeholder="English description (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />

                <textarea
                  value={descMyDraft}
                  onChange={(e) => setDescMyDraft(e.target.value)}
                  placeholder="မြန်မာ ဖော်ပြချက် (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />
              </div>

              <label className="flex items-start gap-2.5 text-sm text-cocoa-600 bg-white border border-cocoa-200 rounded-lg px-4 py-3">
                <input
                  type="checkbox"
                  checked={editOrderable}
                  onChange={(e) => setEditOrderable(e.target.checked)}
                  className="mt-0.5 accent-cocoa-800"
                />
                <span>
                  <span className="block font-medium text-cocoa-800">顾客可直接下单</span>
                  <span className="block text-xs text-cocoa-400 mt-0.5">
                    取消勾选后，此相册仅展示价格（使用每张照片的说明文字），"订购此蛋糕"按钮会被替换为价格展示，顾客无法在线下单。适用于「大蛋糕」这类需要单独报价的相册。
                  </span>
                </span>
              </label>

              {editOrderable ? (
                <div className="bg-white border border-cocoa-200 rounded-lg px-4 py-3">
                  <span className="block text-sm font-medium text-cocoa-800 mb-2">下单表单类型</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label
                      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${
                        editFormType === "cake" ? "border-cocoa-800 bg-cocoa-50" : "border-cocoa-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit-form-type"
                        className="mr-2 accent-cocoa-800"
                        checked={editFormType === "cake"}
                        onChange={() => setEditFormType("cake")}
                      />
                      蛋糕表单 — 尺寸 + 口味 + 两种夹心
                    </label>
                    <label
                      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${
                        editFormType === "dessert" ? "border-cocoa-800 bg-cocoa-50" : "border-cocoa-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit-form-type"
                        className="mr-2 accent-cocoa-800"
                        checked={editFormType === "dessert"}
                        onChange={() => setEditFormType("dessert")}
                      />
                      甜品表单 — 单一价格
                    </label>
                  </div>
                  {editFormType === "dessert" && (
                    <p className="text-xs text-cocoa-400 mt-2">保存后可在下方设置价格。</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-cocoa-400 px-1">仅展示价格模式下不显示下单表单，无需选择表单类型。</p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveFolderInfo}
                  disabled={savingInfo}
                  className="rounded-lg bg-cocoa-800 text-cream px-4 py-2 text-sm font-medium hover:bg-cocoa-900 disabled:opacity-60"
                >
                  {savingInfo ? "保存中..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setEditingName(false);
                    setError("");
                  }}
                  className="text-sm text-cocoa-400 px-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-serif font-medium text-2xl sm:text-3xl text-cocoa-900 truncate">{folder.name}</h1>

                {folder.name_en && <p className="text-sm text-cocoa-400 mt-0.5 truncate">{folder.name_en}</p>}
                {folder.name_my && <p className="text-sm text-cocoa-400 mt-0.5 truncate">{folder.name_my}</p>}

                {folder.description && (
                  <p className="text-cocoa-500 mt-1 text-sm sm:text-base">{folder.description}</p>
                )}
                {folder.description_en && (
                  <p className="text-cocoa-400 mt-1 text-xs sm:text-sm">{folder.description_en}</p>
                )}
                {folder.description_my && (
                  <p className="text-cocoa-400 mt-1 text-xs sm:text-sm">{folder.description_my}</p>
                )}

                <p className="text-xs text-cocoa-400 mt-1.5">
                  {folder.orderable === false
                    ? "仅展示价格 · 顾客无法在线下单"
                    : folder.order_form_type === "dessert"
                    ? "甜品表单 · 顾客可在线下单"
                    : "蛋糕表单 · 顾客可在线下单"}
                </p>
              </div>

              <button
                onClick={startEditingInfo}
                className="text-sm text-cocoa-500 hover:text-cocoa-800 whitespace-nowrap shrink-0"
              >
                Edit info
              </button>
            </div>
          )}
        </div>

        {folder.orderable === false && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            此相册为「仅展示价格」模式：顾客无法在线下单，"订购此蛋糕"按钮会被替换成每张照片的说明文字。请为下方每张照片点击 "Edit" 填写价格信息（可同时填写中文、英文和缅文说明）。
          </div>
        )}

        {folder.orderable !== false && folder.order_form_type === "dessert" && (
          <section className="mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm p-4 sm:p-6">
            <h2 className="font-serif text-lg text-cocoa-900 mb-4">甜品价格</h2>

            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">价格</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-cocoa-500 text-xs font-medium">MMK</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={dessertPrice}
                    onChange={(e) => updateDessertPrice(e.target.value)}
                    placeholder="0"
                    className="w-32 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">最少购买数量</label>
                <input
                  type="number"
                  min={1}
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(Number(e.target.value))}
                  className="w-28 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveDessertOptions}
                disabled={savingDessertOptions}
                className="rounded-lg bg-cocoa-800 text-cream px-4 py-2 text-sm font-medium hover:bg-cocoa-900 disabled:opacity-60"
              >
                {savingDessertOptions ? "保存中..." : "保存"}
              </button>
              {dessertSaveMsg && <span className="text-sm text-cocoa-600">{dessertSaveMsg}</span>}
            </div>
          </section>
        )}

        <div className="mb-8 sm:mb-10 border-2 border-dashed border-cocoa-200 rounded-2xl p-5 sm:p-8 text-center bg-white">
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
            className={`inline-flex items-center justify-center min-h-[48px] rounded-lg bg-cocoa-800 text-cream px-5 py-3 font-medium cursor-pointer hover:bg-cocoa-900 transition-colors ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploading ? uploadProgress || "Uploading..." : "Upload Photos"}
          </label>

          <p className="text-xs text-cocoa-400 mt-2">You can select multiple photos at once.</p>

          {error && !editingName && (
