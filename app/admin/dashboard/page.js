"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";
import { cldThumb } from "@/lib/cloudinary-url";
import { useDragReorder } from "@/lib/useDragReorder";

export default function AdminDashboardPage() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- Create-folder modal state ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOrderable, setNewOrderable] = useState(true);
  const [newFormType, setNewFormType] = useState("cake");
  // Single price for dessert-type folders — the folder name IS the item
  // name, so there's no separate label to fill in.
  const [newDessertPrice, setNewDessertPrice] = useState("");
  const [newMinQuantity, setNewMinQuantity] = useState(6);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOrderable, setEditOrderable] = useState(true);
  const [editFormType, setEditFormType] = useState("cake");
  const [savingEdit, setSavingEdit] = useState(false);

  const { draggingId, handlePointerDown, registerItemRef, wasDragRef } =
    useDragReorder(folders, setFolders, async (orderedIds) => {
      await fetch("/api/folders/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    });

  async function loadFolders() {
    setLoading(true);
    const res = await fetch("/api/folders");
    const data = await res.json();
    setFolders(data.folders || []);
    setLoading(false);
  }

  useEffect(() => {
    loadFolders();
  }, []);

  function updateNewDessertPrice(rawValue) {
    const digits = rawValue.replace(/[^0-9]/g, "");
    setNewDessertPrice(digits);
  }

  function openCreateModal() {
    setNewName("");
    setNewDescription("");
    setNewOrderable(true);
    setNewFormType("cake");
    setNewDessertPrice("");
    setNewMinQuantity(6);
    setError("");
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (creating) return;
    setShowCreateModal(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");

    const price = Number(newDessertPrice) || 0;

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDescription.trim(),
        orderable: newOrderable,
        orderFormType: newFormType,
        dessertOptions:
          newOrderable && newFormType === "dessert" && price > 0
            ? [{ label: newName.trim(), price }]
            : [],
        minQuantity: newMinQuantity,
      }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create folder");
      return;
    }

    setShowCreateModal(false);
    loadFolders();
  }

  function startEditing(folder) {
    setEditingId(folder.id);
    setEditName(folder.name);
    setEditDescription(folder.description || "");
    setEditOrderable(folder.orderable !== false);
    setEditFormType(folder.order_form_type === "dessert" ? "dessert" : "cake");
  }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return;
    setSavingEdit(true);
    await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription,
        orderable: editOrderable,
        orderFormType: editFormType,
      }),
    });
    setSavingEdit(false);
    setEditingId(null);
    loadFolders();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}" and all photos inside it? This cannot be undone.`)) {
      return;
    }
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    loadFolders();
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6 gap-3">
          <h1 className="font-serif font-medium text-3xl text-cocoa-900">Your Albums</h1>

          <button
            onClick={openCreateModal}
            className="shrink-0 rounded-lg bg-cocoa-800 text-cream px-5 py-2.5 font-medium hover:bg-cocoa-900 transition-colors whitespace-nowrap"
          >
            + New Folder
          </button>
        </div>

        {loading ? (
          <p className="text-cocoa-400">Loading albums...</p>
        ) : folders.length === 0 ? (
          <p className="text-cocoa-400">No folders yet. Create your first one above.</p>
        ) : (
          <>
            {folders.length > 1 && (
              <p className="text-xs text-cocoa-400 mb-3">
                Press and hold a card, then drag to reorder albums.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  ref={registerItemRef(folder.id)}
                  onPointerDown={handlePointerDown(folder.id)}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    touchAction: "pan-y",
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                  }}
                  className={`relative rounded-2xl overflow-hidden bg-white shadow-card border select-none cursor-grab active:cursor-grabbing ${
                    draggingId === folder.id ? "border-cocoa-500" : "border-cocoa-100"
                  }`}
                >
                  <Link
                    href={`/admin/folder/${folder.id}`}
                    className="block"
                    onClick={(e) => {
                      if (wasDragRef.current) {
                        e.preventDefault();
                        wasDragRef.current = false;
                      }
                    }}
                  >
                    <div className="relative aspect-[4/3] bg-cocoa-100">
                      {folder.orderable === false ? (
                        <div className="absolute top-2 left-2 z-10 rounded-full bg-cocoa-900/80 text-cream text-[10px] uppercase tracking-wide px-2 py-1">
                          仅展示价格
                        </div>
                      ) : folder.order_form_type === "dessert" ? (
                        <div className="absolute top-2 left-2 z-10 rounded-full bg-cocoa-900/80 text-cream text-[10px] uppercase tracking-wide px-2 py-1">
                          甜品表单
                        </div>
                      ) : null}
                      {folder.cover_url ? (
                        <Image
                          src={cldThumb(folder.cover_url, 500)}
                          alt={folder.name}
                          fill
                          sizes="33vw"
                          className="object-cover pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cocoa-300 text-sm">
                          No photos yet
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    {editingId === folder.id ? (
                      <div className="space-y-3">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                          placeholder="Folder name"
                        />

                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description shown under the album title (optional)"
                          rows={2}
                          className="w-full rounded-md border border-cocoa-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                        />

                        <label className="flex items-start gap-2 text-xs text-cocoa-600 bg-cocoa-50/60 border border-cocoa-100 rounded-lg px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={editOrderable}
                            onChange={(e) => setEditOrderable(e.target.checked)}
                            className="mt-0.5 accent-cocoa-800"
                          />
                          <span>
                            <span className="block font-medium text-cocoa-800">顾客可直接下单</span>
                          </span>
                        </label>

                        {editOrderable ? (
                          <div className="space-y-1.5">
                            <span className="block text-xs font-medium text-cocoa-800">下单表单类型</span>
                            <label
                              className={`block rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                                editFormType === "cake" ? "border-cocoa-800 bg-cocoa-50" : "border-cocoa-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`edit-form-type-${folder.id}`}
                                className="mr-2 accent-cocoa-800"
                                checked={editFormType === "cake"}
                                onChange={() => setEditFormType("cake")}
                              />
                              蛋糕表单 — 尺寸 + 口味 + 两种夹心
                            </label>
                            <label
                              className={`block rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                                editFormType === "dessert" ? "border-cocoa-800 bg-cocoa-50" : "border-cocoa-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`edit-form-type-${folder.id}`}
                                className="mr-2 accent-cocoa-800"
                                checked={editFormType === "dessert"}
                                onChange={() => setEditFormType("dessert")}
                              />
                              甜品表单 — 单一价格
                            </label>
                            {editFormType === "dessert" && (
                              <p className="text-[11px] text-cocoa-400">
                                保存后，进入该相册页面设置价格。
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-cocoa-400">
                            仅展示价格模式下不显示下单表单。
                          </p>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleSaveEdit(folder.id)}
                            disabled={savingEdit}
                            className="text-xs text-cocoa-700 font-medium disabled:opacity-60"
                          >
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-cocoa-400">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/admin/folder/${folder.id}`}>
                            <h2 className="font-serif text-lg text-cocoa-900 hover:underline truncate">
                              {folder.name}
                            </h2>
                          </Link>
                          {folder.description && (
                            <p className="text-xs text-cocoa-500 mt-0.5 line-clamp-2">
                              {folder.description}
                            </p>
                          )}
                          <p className="text-xs text-cocoa-400 mt-0.5">
                            {folder.photo_count} photo{folder.photo_count === 1 ? "" : "s"}
                            {folder.orderable === false
                              ? " · 仅展示价格"
                              : folder.order_form_type === "dessert"
                              ? " · 甜品表单"
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs shrink-0">
                          <button onClick={() => startEditing(folder)} className="text-cocoa-500 hover:text-cocoa-800">
                            Rename
                          </button>
                          <button onClick={() => handleDelete(folder.id, folder.name)} className="text-red-500 hover:text-red-700">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ---- CREATE FOLDER MODAL ---- */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
          onClick={closeCreateModal}
        >
          <div
            className="w-full sm:max-w-md bg-cream rounded-t-2xl sm:rounded-2xl shadow-soft max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-cocoa-200/60 sticky top-0 bg-cream z-10">
              <h2 className="font-serif font-medium text-xl text-cocoa-900">New Album</h2>
              <button
                onClick={closeCreateModal}
                className="text-cocoa-400 hover:text-cocoa-800 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  相册名称 *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：生日蛋糕"
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  描述（可选）
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="这段文字会显示在相册标题下方，向顾客介绍这个系列"
                  rows={3}
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />
              </div>

              <label className="flex items-start gap-2.5 text-sm text-cocoa-600 bg-white border border-cocoa-200 rounded-lg px-4 py-3">
                <input
                  type="checkbox"
                  checked={newOrderable}
                  onChange={(e) => setNewOrderable(e.target.checked)}
                  className="mt-0.5 accent-cocoa-800"
                />
                <span>
                  <span className="block font-medium text-cocoa-800">顾客可直接下单</span>
                  <span className="block text-xs text-cocoa-400 mt-0.5">
                    取消勾选后，此相册仅展示价格（使用每张照片的说明文字），顾客无法在线下单。
                  </span>
                </span>
              </label>

              {newOrderable ? (
                <div className="bg-white border border-cocoa-200 rounded-lg px-4 py-3">
                  <span className="block text-sm font-medium text-cocoa-800 mb-2">下单表单类型</span>
                  <div className="flex flex-col gap-2">
                    <label
                      className={`rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${
                        newFormType === "cake" ? "border-cocoa-800 bg-cocoa-50" : "border-cocoa-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="new-form-type"
                        className="mr-2 accent-cocoa-800"
                        checked={newFormType === "cake"}
                        onChange={() => setNewFormType("cake")}
                      />
                      蛋糕表单（默认）— 尺寸 + 口味 + 两种夹心
                    </label>
                    <label
                      className={`rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${
                        newFormType === "dessert" ? "border-cocoa-800 bg-cocoa-50" : "border-cocoa-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="new-form-type"
                        className="mr-2 accent-cocoa-800"
                        checked={newFormType === "dessert"}
                        onChange={() => setNewFormType("dessert")}
                      />
                      甜品表单 — 单一价格
                    </label>
                  </div>

                  {/* Price + minimum quantity — set right here as soon as
                      甜品表单 is chosen. Can be changed later on the
                      folder page too. */}
                  {newFormType === "dessert" && (
                    <div className="mt-4 pt-4 border-t border-cocoa-100 flex flex-wrap items-end gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                          价格
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-cocoa-500 text-xs font-medium">MMK</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={newDessertPrice}
                            onChange={(e) => updateNewDessertPrice(e.target.value)}
                            placeholder="0"
                            className="w-32 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                          最少购买数量
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newMinQuantity}
                          onChange={(e) => setNewMinQuantity(Number(e.target.value))}
                          className="w-28 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-cocoa-400 px-1">
                  已取消勾选「顾客可直接下单」，此相册不会显示下单表单。
                </p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 rounded-lg bg-cocoa-800 text-cream py-2.5 font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Album"}
                </button>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-lg border border-cocoa-200 text-cocoa-500 px-4 py-2.5 text-sm hover:bg-cocoa-50 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
