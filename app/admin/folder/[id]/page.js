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
  const [descDraft, setDescDraft] = useState("");
  const [editOrderable, setEditOrderable] = useState(true);
  const [editFormType, setEditFormType] = useState("cake");
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");

  const [settingCoverId, setSettingCoverId] = useState(null);
  const [dessertOptions, setDessertOptions] = useState([]);
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

    const res = await fetch(
      `/api/folders/${folderId}?limit=${PAGE_SIZE}&offset=0`,
      { cache: "no-store" }
    );
    
    if (res.ok) {
      const data = await res.json();

      setFolder(data.folder);
      setPhotos(data.photos || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setNameDraft(data.folder.name);
      setDescDraft(data.folder.description || "");
      setEditOrderable(data.folder.orderable !== false);
      setEditFormType(data.folder.order_form_type === "dessert" ? "dessert" : "cake");
      setDessertOptions(data.folder.dessert_options || []);
      setMinQuantity(data.folder.dessert_min_quantity || 6);
    }

    setLoading(false);
  }

  async function loadMorePhotos() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const res = await fetch(
      `/api/folders/${folderId}/photos?limit=${PAGE_SIZE}&offset=${photos.length}`
    );

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

  // This was referenced by the "Edit info" Save button but never defined —
  // that's what threw "handleSaveFolderInfo is not defined". Now it saves
  // name/description AND the order-mode settings in one request.
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
        description: descDraft,
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

  async function handleSaveDessertOptions() {
    setSavingDessertOptions(true);
    setDessertSaveMsg("");

    const res = await fetch(`/api/folders/${folderId}/order-form`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dessertOptions: dessertOptions.filter((o) => o.label.trim()),
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

  function updateDessertOption(i, field, value) {
    setDessertOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, [field]: value } : o))
    );
  }

  // Price stays a plain text field, digits only. type="number" was causing
  // the cursor/leading-zero jumping and letting the mouse scroll wheel
  // silently change the value when it happened to be hovering the input.
  function updateDessertOptionPrice(i, rawValue) {
    const digits = rawValue.replace(/[^0-9]/g, "");
    updateDessertOption(i, "price", digits === "" ? "" : Number(digits));
  }

  function addDessertOption() {
    setDessertOptions((prev) => [...prev, { label: "", price: 0 }]);
  }

  function removeDessertOption(i) {
    setDessertOptions((prev) => prev.filter((_, idx) => idx !== i));
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

      const {
        timestamp,
        signature,
        apiKey,
        cloudName,
        folder: cloudFolder,
        transformation,
      } = await signRes.json();

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

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: formData }
          );

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(
              errData.error?.message || `Cloudinary upload failed for ${file.name}`
            );
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
      body: JSON.stringify({ caption: captionDraft }),
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
    setDescDraft(folder.description || "");
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
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2.5 font-serif text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />

                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="Optional description"
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
                      甜品表单 — 单层，自定义价格选项
                    </label>
                  </div>
                  {editFormType === "dessert" && (
                    <p className="text-xs text-cocoa-400 mt-2">
                      保存后可在下方「甜品价格选项」区域设置具体价格。
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-cocoa-400 px-1">
                  仅展示价格模式下不显示下单表单，无需选择表单类型。
                </p>
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
                  onClick={() => { setEditingName(false); setError(""); }}
                  className="text-sm text-cocoa-400 px-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-serif font-medium text-2xl sm:text-3xl text-cocoa-900 truncate">
                  {folder.name}
                </h1>

                {folder.description && (
                  <p className="text-cocoa-500 mt-1 text-sm sm:text-base">{folder.description}</p>
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
            此相册为「仅展示价格」模式：顾客无法在线下单，"订购此蛋糕"按钮会被替换成每张照片的说明文字。请为下方每张照片点击 "Edit" 填写价格信息。
          </div>
        )}

        {folder.orderable !== false && folder.order_form_type === "dessert" && (
          <section className="mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm p-4 sm:p-6">
            <h2 className="font-serif text-lg text-cocoa-900 mb-1">甜品价格选项</h2>
            <p className="text-xs text-cocoa-400 mb-4">
              顾客下单时会从这些选项中选择一项，订购卡片将只显示照片（单层），不再显示口味/夹心图标。
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                最少购买数量
              </label>
              <input
                type="number"
                min={1}
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value))}
                className="w-28 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
              />
              <p className="text-xs text-cocoa-400 mt-1">
                顾客下单时如果数量少于此值，将无法提交（会用中文提示最低购买数量）。
              </p>
            </div>

            <div className="space-y-3">
              {dessertOptions.map((o, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-cocoa-50/30 rounded-xl border border-cocoa-100">
                  <input
                    value={o.label}
                    onChange={(e) => updateDessertOption(i, "label", e.target.value)}
                    placeholder="例如：芒果慕斯"
                    className="flex-1 min-w-0 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-cocoa-500 text-xs font-medium shrink-0">MMK</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={o.price}
                      onChange={(e) => updateDessertOptionPrice(i, e.target.value)}
                      className="w-24 rounded-lg border border-cocoa-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                    />
                  </div>
                  <button onClick={() => removeDessertOption(i)} className="text-red-500 hover:text-red-700 text-xs px-1.5 py-1 shrink-0 font-medium">
                    删除
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button onClick={addDessertOption} className="text-sm text-cocoa-700 hover:text-cocoa-900 font-medium">
                + 添加选项
              </button>
              <button
                onClick={handleSaveDessertOptions}
                disabled={savingDessertOptions}
                className="rounded-lg bg-cocoa-800 text-cream px-4 py-2 text-sm font-medium hover:bg-cocoa-900 disabled:opacity-60"
              >
                {savingDessertOptions ? "保存中..." : "保存价格选项"}
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
            <p className="text-sm text-red-600 mt-3 whitespace-pre-wrap break-words">{error}</p>
          )}
        </div>

        {photos.length === 0 ? (
          <p className="text-cocoa-400">No photos in this album yet.</p>
        ) : (
          <>
            {photos.length > 1 && (
              <p className="text-xs text-cocoa-400 mb-3">
                Press and hold a photo, then drag to reorder. Use "Set as cover" to choose the album thumbnail.
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {photos.map((photo) => {
                const isCover = folder.cover_url === photo.url;

                return (
                  <div
                    key={photo.id}
                    ref={registerItemRef(photo.id)}
                    onPointerDown={handlePointerDown(photo.id)}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      touchAction: "pan-y",
                      WebkitTouchCallout: "none",
                      WebkitUserSelect: "none",
                    }}
                    className={`rounded-xl overflow-hidden bg-white border shadow-card select-none cursor-grab active:cursor-grabbing ${
                      draggingId === photo.id ? "border-cocoa-500" : "border-cocoa-100"
                    }`}
                  >
                    <div className="relative aspect-square bg-cocoa-100">
                      {isCover && (
                        <div className="absolute top-2 right-2 z-10 rounded-full bg-cocoa-800 text-cream text-[10px] uppercase tracking-wide px-2 py-1">
                          Cover
                        </div>
                      )}

                      <Image
                        src={cldThumb(photo.url, 400)}
                        alt={photo.caption || "photo"}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover pointer-events-none"
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
                            className="w-full text-xs rounded-md border border-cocoa-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                          />

                          <div className="flex gap-3 text-xs">
                            <button onClick={() => handleSaveCaption(photo.id)} className="text-cocoa-700 font-medium py-1">
                              Save
                            </button>
                            <button onClick={() => setEditingCaptionId(null)} className="text-cocoa-400 py-1">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs text-cocoa-500 truncate">{photo.caption || "No caption"}</p>

                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            <button
                              onClick={() => {
                                setEditingCaptionId(photo.id);
                                setCaptionDraft(photo.caption || "");
                              }}
                              className="text-cocoa-500 hover:text-cocoa-800 py-1"
                            >
                              Edit
                            </button>

                            {!isCover && (
                              <button
                                onClick={() => handleSetCover(photo)}
                                disabled={settingCoverId === photo.id}
                                className="text-cocoa-500 hover:text-cocoa-800 py-1 disabled:opacity-60"
                              >
                                {settingCoverId === photo.id ? "Setting..." : "Set as cover"}
                              </button>
                            )}

                            <button onClick={() => handleDeletePhoto(photo.id)} className="text-red-500 hover:text-red-700 py-1">
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMorePhotos}
                  disabled={loadingMore}
                  className="rounded-lg border border-cocoa-300 text-cocoa-700 px-5 py-2 text-sm font-medium hover:bg-cocoa-50 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : `Load more (${photos.length} of ${total})`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
