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
  const [newName, setNewName] = useState("");
  const [newOrderable, setNewOrderable] = useState(true);
  const [newFormType, setNewFormType] = useState("cake");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
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

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        orderable: newOrderable,
        orderFormType: newFormType,
      }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create folder");
      return;
    }

    setNewName("");
    setNewOrderable(true);
    setNewFormType("cake");
    loadFolders();
  }

  function startEditing(folder) {
    setEditingId(folder.id);
    setEditName(folder.name);
    setEditOrderable(folder.orderable !== false);
    setEditFormType(folder.order_form_type === "dessert" ? "dessert" : "cake");
  }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return;
    setSavingEdit(true);
    await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), orderable: editOrderable, orderFormType: editFormType }),
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
        <h1 className="font-serif font-medium text-3xl text-cocoa-900 mb-6">Your Albums</h1>

        <form onSubmit={handleCreate} className="mb-10 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New folder name"
              className="flex-1 rounded-lg border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
            />

            <button
              type="submit"
              disabled={creating}
              className="w-full sm:w-auto rounded-lg bg-cocoa-800 text-cream px-5 py-3 font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {creating ? "Creating..." : "+ New Folder"}
            </button>
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
                取消勾选后，此相册仅展示价格（使用照片说明文字），顾客无法在线下单。
              </span>
            </span>
          </label>

          {newOrderable && (
            <div className="bg-white border border-cocoa-200 rounded-lg px-4 py-3">
              <span className="block text-sm font-medium text-cocoa-800 mb-2">下单表单类型</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <label
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${
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
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${
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
                  甜品表单 — 单层，自定义价格选项
                </label>
              </div>
              {newFormType === "dessert" && (
                <p className="text-xs text-cocoa-400 mt-2">
                  创建后进入该相册页面设置具体的价格选项。
                </p>
              )}
            </div>
          )}
        </form>
        {error && <p className="text-sm text-red-600 -mt-8 mb-8">{error}</p>}

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
                      <div className="space-y-2.5">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-cocoa-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                        />
                        <label className="flex items-center gap-2 text-xs text-cocoa-600">
                          <input
                            type="checkbox"
                            checked={editOrderable}
                            onChange={(e) => setEditOrderable(e.target.checked)}
                            className="accent-cocoa-800"
                          />
                          顾客可直接下单
                        </label>
                        {editOrderable && (
                          <select
                            value={editFormType}
                            onChange={(e) => setEditFormType(e.target.value)}
                            className="w-full text-xs rounded-md border border-cocoa-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                          >
                            <option value="cake">蛋糕表单（尺寸/口味/夹心）</option>
                            <option value="dessert">甜品表单（单层/自定义价格）</option>
                          </select>
                        )}
                        <div className="flex gap-3">
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
                        <div>
                          <Link href={`/admin/folder/${folder.id}`}>
                            <h2 className="font-serif text-lg text-cocoa-900 hover:underline">
                              {folder.name}
                            </h2>
                          </Link>
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
    </div>
  );
}
