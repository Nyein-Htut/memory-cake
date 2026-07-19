"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";

export default function AdminDashboardPage() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

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
      body: JSON.stringify({ name: newName.trim() }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create folder");
      return;
    }

    setNewName("");
    loadFolders();
  }

  async function handleRename(id) {
    if (!editName.trim()) return;
    await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
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

        <form onSubmit={handleCreate} className="flex gap-3 mb-10">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New folder name"
            className="flex-1 rounded-lg border border-cocoa-200 bg-white px-4 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-cocoa-800 text-cream px-5 py-2.5 font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {creating ? "Creating..." : "+ New Folder"}
          </button>
        </form>
        {error && <p className="text-sm text-red-600 -mt-8 mb-8">{error}</p>}

        {loading ? (
          <p className="text-cocoa-400">Loading albums...</p>
        ) : folders.length === 0 ? (
          <p className="text-cocoa-400">No folders yet. Create your first one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="rounded-2xl overflow-hidden bg-white shadow-card border border-cocoa-100"
              >
                <Link href={`/admin/folder/${folder.id}`} className="block">
                  <div className="relative aspect-[4/3] bg-cocoa-100">
                    {folder.cover_url ? (
                      <Image
                        src={folder.cover_url}
                        alt={folder.name}
                        fill
                        sizes="33vw"
                        className="object-cover"
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
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(folder.id)}
                        className="flex-1 rounded-md border border-cocoa-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                      />
                      <button
                        onClick={() => handleRename(folder.id)}
                        className="text-xs text-cocoa-700 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-cocoa-400"
                      >
                        Cancel
                      </button>
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
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(folder.id);
                            setEditName(folder.name);
                          }}
                          className="text-cocoa-500 hover:text-cocoa-800"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDelete(folder.id, folder.name)}
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
