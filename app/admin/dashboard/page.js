"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import AdminHeader from "@/components/AdminHeader";
import { cldThumb } from "@/lib/cloudinary";
import { useDragReorder } from "@/lib/useDragReorder";

export default function AdminDashboardPage() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDescriptionEn, setEditDescriptionEn] = useState("");
  const [editOrderable, setEditOrderable] = useState(true);
  const [editFormType, setEditFormType] = useState("cake");

  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /*
   * IMPORTANT:
   * This is the SAME shared drag hook used by the photo page.
   * Do not modify useDragReorder.js.
   */
  const {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  } = useDragReorder(
    folders,
    setFolders,
    async (orderedIds) => {
      try {
        const response = await fetch("/api/folders/reorder", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderedIds,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save folder order");
        }
      } catch (error) {
        console.error(
          "Failed to save folder order:",
          error
        );
      }
    }
  );

  /*
   * Load folders
   */
  useEffect(() => {
    let cancelled = false;

    async function loadFolders() {
      try {
        setLoading(true);

        const response = await fetch("/api/folders", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load folders");
        }

        const data = await response.json();

        if (!cancelled) {
          /*
           * Supports either:
           *   { folders: [...] }
           * or
           *   [...]
           */
          const loadedFolders = Array.isArray(data)
            ? data
            : data.folders || [];

          setFolders(loadedFolders);
        }
      } catch (error) {
        console.error(
          "Failed to load folders:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFolders();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Start editing a folder
   */
  function startEditing(folder) {
    setEditingId(folder.id);

    setEditName(folder.name || "");
    setEditNameEn(folder.name_en || "");
    setEditDescription(folder.description || "");
    setEditDescriptionEn(
      folder.description_en || ""
    );

    setEditOrderable(
      folder.orderable !== false
    );

    setEditFormType(
      folder.order_form_type || "cake"
    );
  }

  /*
   * Save folder edit
   */
  async function handleSaveEdit(folderId) {
    if (!editName.trim()) {
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(
        `/api/folders/${folderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            name_en: editNameEn.trim(),
            description: editDescription.trim(),
            description_en:
              editDescriptionEn.trim(),
            orderable: editOrderable,
            order_form_type: editOrderable
              ? editFormType
              : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update folder"
        );
      }

      const data = await response.json();

      const updatedFolder =
        data.folder || data;

      setFolders((current) =>
        current.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                ...updatedFolder,
                name:
                  updatedFolder.name ??
                  editName.trim(),
                name_en:
                  updatedFolder.name_en ??
                  editNameEn.trim(),
                description:
                  updatedFolder.description ??
                  editDescription.trim(),
                description_en:
                  updatedFolder.description_en ??
                  editDescriptionEn.trim(),
                orderable:
                  updatedFolder.orderable ??
                  editOrderable,
                order_form_type:
                  updatedFolder.order_form_type ??
                  (editOrderable
                    ? editFormType
                    : null),
              }
            : folder
        )
      );

      setEditingId(null);
    } catch (error) {
      console.error(
        "Failed to save folder:",
        error
      );
    } finally {
      setSavingEdit(false);
    }
  }

  /*
   * Delete folder
   */
  async function handleDelete(folderId, folderName) {
    const confirmed = window.confirm(
      `Delete "${folderName}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(folderId);

      const response = await fetch(
        `/api/folders/${folderId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete folder"
        );
      }

      setFolders((current) =>
        current.filter(
          (folder) => folder.id !== folderId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete folder:",
        error
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cocoa-400 mb-2">
              Admin
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl text-cocoa-900">
              Folders
            </h1>

            <p className="text-sm text-cocoa-500 mt-2">
              Manage your photo folders and
              customer ordering options.
            </p>
          </div>

          <div className="text-sm text-cocoa-400">
            {folders.length} folder
            {folders.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden bg-white border border-cocoa-100 shadow-card animate-pulse"
                >
                  <div className="aspect-[4/3] bg-cocoa-100" />

                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-cocoa-100 rounded w-2/3" />
                    <div className="h-3 bg-cocoa-100 rounded w-1/2" />
                    <div className="h-3 bg-cocoa-100 rounded w-1/3" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : folders.length === 0 ? (
          /* EMPTY STATE */

          <div className="rounded-2xl border border-dashed border-cocoa-200 bg-white px-6 py-16 text-center">
            <h2 className="font-serif text-2xl text-cocoa-900">
              No folders yet
            </h2>

            <p className="text-sm text-cocoa-500 mt-2">
              Create your first folder to start
              organizing your photos.
            </p>
          </div>
        ) : (
          /* FOLDER GRID */

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {folders.map((folder) => {
              const isDragging =
                draggingId === folder.id;

              const isDeleting =
                deletingId === folder.id;

              const isEditing =
                editingId === folder.id;

              return (
                <div
                  key={folder.id}
                  ref={registerItemRef(
                    folder.id
                  )}
                  onPointerDown={handlePointerDown(
                    folder.id
                  )}
                  onContextMenu={(e) =>
                    e.preventDefault()
                  }
                  style={{
                    /*
                     * VERY IMPORTANT:
                     *
                     * pan-y keeps normal vertical
                     * page scrolling on mobile.
                     *
                     * Do NOT change this to
                     * touchAction: "none".
                     */
                    touchAction: "pan-y",

                    WebkitTouchCallout:
                      "none",

                    WebkitUserSelect:
                      "none",
                  }}
                  className={`
                    relative
                    rounded-2xl
                    overflow-hidden
                    bg-white
                    shadow-card
                    border
                    select-none
                    cursor-grab
                    active:cursor-grabbing
                    ${
                      isDragging
                        ? "border-cocoa-500"
                        : "border-cocoa-100"
                    }
                  `}
                >
                  {/* ==================================================
                      IMAGE
                      ================================================== */}

                  <div className="relative aspect-[4/3] bg-cocoa-100">
                    {folder.orderable ===
                      false ? (
                      <div className="absolute top-2 left-2 z-10 rounded-full bg-cocoa-900/80 text-cream text-[10px] uppercase tracking-wide px-2 py-1 pointer-events-none">
                        仅展示价格
                      </div>
                    ) : folder.order_form_type ===
                      "dessert" ? (
                      <div className="absolute top-2 left-2 z-10 rounded-full bg-cocoa-900/80 text-cream text-[10px] uppercase tracking-wide px-2 py-1 pointer-events-none">
                        甜品表单
                      </div>
                    ) : null}

                    {folder.cover_url ? (
                      <Image
                        src={cldThumb(
                          folder.cover_url,
                          500
                        )}
                        alt={
                          folder.name ||
                          "Folder"
                        }
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
                        className="object-cover pointer-events-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cocoa-300 text-sm pointer-events-none">
                        No photos yet
                      </div>
                    )}

                    {/*
                     * IMPORTANT:
                     *
                     * The Link is NOT wrapping the image.
                     *
                     * The image has pointer-events-none,
                     * so pointerdown reaches the draggable
                     * folder card.
                     *
                     * This is the main difference that
                     * fixes the folder drag interaction.
                     */}
                    <Link
                      href={`/admin/folder/${folder.id}`}
                      aria-label={`Open ${
                        folder.name ||
                        "folder"
                      }`}
                      className="absolute inset-0 z-20"
                      onClick={(e) => {
                        if (
                          wasDragRef.current
                        ) {
                          e.preventDefault();
                          wasDragRef.current =
                            false;
                        }
                      }}
                    />
                  </div>

                  {/* ==================================================
                      FOLDER INFORMATION
                      ================================================== */}

                  <div className="p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        {/* Chinese name */}

                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) =>
                            setEditName(
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                          placeholder="中文名称 Folder name"
                        />

                        {/* English name */}

                        <input
                          value={editNameEn}
                          onChange={(e) =>
                            setEditNameEn(
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                          placeholder="English name (optional)"
                        />

                        {/* Chinese description */}

                        <textarea
                          value={
                            editDescription
                          }
                          onChange={(e) =>
                            setEditDescription(
                              e.target.value
                            )
                          }
                          placeholder="Description shown under the album title (optional)"
                          rows={2}
                          className="w-full rounded-md border border-cocoa-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                        />

                        {/* English description */}

                        <textarea
                          value={
                            editDescriptionEn
                          }
                          onChange={(e) =>
                            setEditDescriptionEn(
                              e.target.value
                            )
                          }
                          placeholder="English description (optional)"
                          rows={2}
                          className="w-full rounded-md border border-cocoa-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                        />

                        {/* Orderable */}

                        <label className="flex items-start gap-2 text-xs text-cocoa-600 bg-cocoa-50/60 border border-cocoa-100 rounded-lg px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={
                              editOrderable
                            }
                            onChange={(e) =>
                              setEditOrderable(
                                e.target
                                  .checked
                              )
                            }
                            className="mt-0.5 accent-cocoa-800"
                          />

                          <span>
                            <span className="block font-medium text-cocoa-800">
                              顾客可直接下单
                            </span>

                            <span className="block text-[11px] text-cocoa-400 mt-0.5">
                              Customers can
                              submit an
                              order from
                              this folder.
                            </span>
                          </span>
                        </label>

                        {/* Form type */}

                        {editOrderable ? (
                          <div className="space-y-1.5">
                            <span className="block text-xs font-medium text-cocoa-800">
                              下单表单类型
                            </span>

                            <label
                              className={`
                                block
                                rounded-lg
                                border
                                px-3
                                py-2
                                text-xs
                                cursor-pointer
                                ${
                                  editFormType ===
                                  "cake"
                                    ? "border-cocoa-800 bg-cocoa-50"
                                    : "border-cocoa-200"
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name={`edit-form-type-${folder.id}`}
                                className="mr-2 accent-cocoa-800"
                                checked={
                                  editFormType ===
                                  "cake"
                                }
                                onChange={() =>
                                  setEditFormType(
                                    "cake"
                                  )
                                }
                              />

                              蛋糕表单 —
                              尺寸 + 口味 +
                              两种夹心
                            </label>

                            <label
                              className={`
                                block
                                rounded-lg
                                border
                                px-3
                                py-2
                                text-xs
                                cursor-pointer
                                ${
                                  editFormType ===
                                  "dessert"
                                    ? "border-cocoa-800 bg-cocoa-50"
                                    : "border-cocoa-200"
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name={`edit-form-type-${folder.id}`}
                                className="mr-2 accent-cocoa-800"
                                checked={
                                  editFormType ===
                                  "dessert"
                                }
                                onChange={() =>
                                  setEditFormType(
                                    "dessert"
                                  )
                                }
                              />

                              甜品表单 —
                              单一价格
                            </label>

                            {editFormType ===
                              "dessert" && (
                              <p className="text-[11px] text-cocoa-400">
                                保存后，进入
                                该相册页面
                                设置价格。
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-cocoa-400">
                            仅展示价格模式下
                            不显示下单表单。
                          </p>
                        )}

                        {/* Edit buttons */}

                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveEdit(
                                folder.id
                              )
                            }
                            disabled={
                              savingEdit
                            }
                            className="text-xs text-cocoa-700 font-medium disabled:opacity-60"
                          >
                            {savingEdit
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(
                                null
                              )
                            }
                            disabled={
                              savingEdit
                            }
                            className="text-xs text-cocoa-400 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ==================================================
                         NORMAL FOLDER INFORMATION
                         ================================================== */

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* Folder name */}

                          <Link
                            href={`/admin/folder/${folder.id}`}
                            onClick={(e) => {
                              if (
                                wasDragRef.current
                              ) {
                                e.preventDefault();

                                wasDragRef.current =
                                  false;
                              }
                            }}
                          >
                            <h2 className="font-serif text-lg text-cocoa-900 hover:underline truncate">
                              {folder.name}
                            </h2>
                          </Link>

                          {/* English name */}

                          {folder.name_en && (
                            <p className="text-xs text-cocoa-400 truncate">
                              {
                                folder.name_en
                              }
                            </p>
                          )}

                          {/* Description */}

                          {folder.description && (
                            <p className="text-xs text-cocoa-500 mt-0.5 line-clamp-2">
                              {
                                folder.description
                              }
                            </p>
                          )}

                          {/* Photo count */}

                          <p className="text-xs text-cocoa-400 mt-0.5">
                            {
                              folder.photo_count
                            }{" "}
                            photo
                            {folder.photo_count ===
                            1
                              ? ""
                              : "s"}

                            {folder.orderable ===
                            false
                              ? " · 仅展示价格"
                              : folder.order_form_type ===
                                "dessert"
                              ? " · 甜品表单"
                              : ""}
                          </p>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex flex-col items-end gap-1 text-xs shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                folder
                              )
                            }
                            className="text-cocoa-500 hover:text-cocoa-800"
                          >
                            Rename
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                folder.id,
                                folder.name
                              )
                            }
                            disabled={
                              isDeleting
                            }
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SMALL MOBILE HINT */}

        {!loading && folders.length > 0 && (
          <p className="text-center text-[11px] text-cocoa-300 mt-8">
            Press and hold a folder to move it.
          </p>
        )}
      </main>
    </div>
  );
}
