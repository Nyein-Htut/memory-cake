"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";
import { cldThumb } from "@/lib/cloudinary-url";
import { useDragReorder } from "@/lib/useDragReorder";

export default function AdminHeroSlidesPage() {
  const fileInputRef = useRef(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const { draggingId, handlePointerDown, registerItemRef } = useDragReorder(
    slides,
    setSlides,
    async (orderedIds) => {
      await fetch("/api/hero-slides/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    }
  );

  async function loadSlides() {
    setLoading(true);
    const res = await fetch("/api/hero-slides?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSlides(data.slides || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSlides();
  }, []);

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const signRes = await fetch("/api/hero-slides/upload-sign", { method: "POST" });
      if (!signRes.ok) throw new Error("无法获取上传权限");

      const { timestamp, signature, apiKey, cloudName, folder, transformation } = await signRes.json();

      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`正在上传第 ${i + 1} / ${files.length} 张...`);

        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("transformation", transformation);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `第 ${files[i].name} 张上传失败`);
        }

        const uploaded = await uploadRes.json();

        const saveRes = await fetch("/api/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: uploaded.secure_url, publicId: uploaded.public_id }),
        });

        if (!saveRes.ok) throw new Error("图片已上传，但保存失败，请重试");
      }

      await loadSlides();
    } catch (err) {
      setError(err.message || "上传时出现问题");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleToggleActive(slide) {
    setTogglingId(slide.id);
    const res = await fetch(`/api/hero-slides/${slide.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !slide.active }),
    });
    setTogglingId(null);
    if (res.ok) {
      setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, active: !s.active } : s)));
    } else {
      setError("更新状态失败，请重试");
    }
  }

  async function handleDelete(slide) {
    if (!confirm("删除这张轮播图？此操作无法撤销。")) return;
    const res = await fetch(`/api/hero-slides/${slide.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("删除失败，请重试");
      return;
    }
    loadSlides();
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-serif font-medium text-2xl sm:text-3xl text-cocoa-900 mb-1">首页轮播图</h1>
        <p className="text-xs sm:text-sm text-cocoa-400 mb-6">停用的图片不会显示在首页</p>

        <div className="mb-8 border-2 border-dashed border-cocoa-200 rounded-2xl p-6 sm:p-8 text-center bg-white">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
            id="hero-slide-upload"
            disabled={uploading}
          />
          <label
            htmlFor="hero-slide-upload"
            className={`inline-flex items-center justify-center gap-2 min-h-[48px] rounded-lg bg-cocoa-800 text-cream px-6 py-3 font-medium cursor-pointer hover:bg-cocoa-900 transition-colors ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploading ? uploadProgress || "上传中..." : "+ 上传图片"}
          </label>
          {!uploading && (
            <p className="text-xs text-cocoa-400 mt-2.5">建议横向 16:9 图片，可多选</p>
          )}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        {loading ? (
          <p className="text-cocoa-400">加载中...</p>
        ) : slides.length === 0 ? (
          <p className="text-cocoa-400 text-center py-8">暂无图片，点击上方按钮上传</p>
        ) : (
          <>
            {slides.length > 1 && (
              <p className="text-xs text-cocoa-400 mb-3">按住拖动可调整顺序</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  ref={registerItemRef(slide.id)}
                  onPointerDown={handlePointerDown(slide.id)}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ touchAction: "pan-y", WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
                  className={`rounded-xl overflow-hidden bg-white border shadow-card select-none cursor-grab active:cursor-grabbing ${
                    draggingId === slide.id ? "border-cocoa-500" : "border-cocoa-100"
                  }`}
                >
                  <div className="relative aspect-video bg-cocoa-100">
                    {!slide.active && (
                      <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                        <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">已停用</span>
                      </div>
                    )}
                    <Image
                      src={cldThumb(slide.url, 500)}
                      alt="轮播图片"
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover pointer-events-none"
                    />
                  </div>

                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-cocoa-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slide.active}
                        onChange={() => handleToggleActive(slide)}
                        disabled={togglingId === slide.id}
                        className="accent-cocoa-800"
                      />
                      {slide.active ? "显示中" : "已停用"}
                    </label>
                    <button onClick={() => handleDelete(slide)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                      删除
                    </button>
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
