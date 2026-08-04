"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { uploadOptionImage } from "@/lib/uploadOptionImage";

export default function AdminSettingsPage() {
  const [sizes, setSizes] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [fillings, setFillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/order-options")
      .then((res) => res.json())
      .then((data) => {
        setSizes(data.options?.sizes || []);
        setFlavors(data.options?.flavors || []);
        setFillings(data.options?.fillings || []);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateSize(i, field, value) {
    setSizes((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addSize() {
    setSizes((prev) => [...prev, { label: "", price: 0 }]);
  }

  function removeSize(i) {
    setSizes((prev) => prev.filter((_, idx) => idx !== i));
  }

  const [uploadingFlavorIdx, setUploadingFlavorIdx] = useState(null);
  const [uploadingFillingIdx, setUploadingFillingIdx] = useState(null);

  function updateFlavor(i, field, value) {
    setFlavors((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }
  function addFlavor() {
    setFlavors((prev) => [...prev, { label: "", imageUrl: null }]);
  }
  function removeFlavor(i) {
    setFlavors((prev) => prev.filter((_, idx) => idx !== i));
  }
  async function handleFlavorImage(i, file) {
    if (!file) return;
    setUploadingFlavorIdx(i);
    try {
      const url = await uploadOptionImage(file);
      updateFlavor(i, "imageUrl", url);
    } catch (err) {
      setMessage(err.message || "图片上传失败");
    } finally {
      setUploadingFlavorIdx(null);
    }
  }

  function updateFilling(i, field, value) {
    setFillings((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }
  function addFilling() {
    setFillings((prev) => [...prev, { label: "", imageUrl: null }]);
  }
  function removeFilling(i) {
    setFillings((prev) => prev.filter((_, idx) => idx !== i));
  }
  async function handleFillingImage(i, file) {
    if (!file) return;
    setUploadingFillingIdx(i);
    try {
      const url = await uploadOptionImage(file);
      updateFilling(i, "imageUrl", url);
    } catch (err) {
      setMessage(err.message || "图片上传失败");
    } finally {
      setUploadingFillingIdx(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/order-options", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sizes: sizes.filter((s) => s.label.trim()),
        flavors: flavors.filter((f) => f.label.trim()),
        fillings: fillings.filter((f) => f.label.trim()),
      }),
    });

    setSaving(false);

    if (res.ok) {
      setMessage("已保存");
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage("保存失败，请重试");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminHeader />
        <p className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-cocoa-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24 sm:pb-10">
      <AdminHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-serif font-medium text-2xl sm:text-3xl text-cocoa-900 mb-2">订购设置</h1>
        <p className="text-xs sm:text-sm text-cocoa-400 mb-6 sm:mb-8">
          管理下单表单中可供顾客选择的尺寸、价格、口味和夹心/水果选项
        </p>

        {/* 尺寸与价格 Section */}
        <section className="mb-6 sm:mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl text-cocoa-900 mb-4">尺寸与价格</h2>
          <div className="space-y-3">
            {sizes.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 sm:p-3 bg-cocoa-50/30 rounded-xl border border-cocoa-100"
              >
                <input
                  value={s.label}
                  onChange={(e) => updateSize(i, "label", e.target.value)}
                  placeholder="例如：6寸"
                  className="flex-1 min-w-0 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-cocoa-500 text-xs font-medium shrink-0">MMK</span>
                  <input
                    type="number"
                    value={s.price}
                    onChange={(e) => updateSize(i, "price", Number(e.target.value))}
                    className="w-20 sm:w-28 rounded-lg border border-cocoa-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                  />
                </div>

                <button
                  onClick={() => removeSize(i)}
                  className="text-red-500 hover:text-red-700 text-xs sm:text-sm px-1.5 py-1 shrink-0 font-medium"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addSize}
            className="mt-4 text-xs sm:text-sm text-cocoa-700 hover:text-cocoa-900 font-medium flex items-center gap-1"
          >
            + 添加尺寸
          </button>
        </section>

        {/* 口味 Section */}
        <section className="mb-6 sm:mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl text-cocoa-900 mb-4">口味</h2>
          <div className="space-y-3">
            {flavors.map((f, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-cocoa-50/30 rounded-xl border border-cocoa-100">
                <label className="shrink-0 relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-cocoa-200 bg-white cursor-pointer flex items-center justify-center text-cocoa-400 text-[10px] text-center">
                  {f.imageUrl ? (
                    <img src={f.imageUrl} alt={f.label} className="w-full h-full object-cover" />
                  ) : uploadingFlavorIdx === i ? (
                    "上传中"
                  ) : (
                    "+ 图片"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFlavorImage(i, e.target.files?.[0])}
                  />
                </label>
                <input
                  value={f.label}
                  onChange={(e) => updateFlavor(i, "label", e.target.value)}
                  placeholder="例如：巧克力"
                  className="flex-1 min-w-0 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />
                <button
                  onClick={() => removeFlavor(i)}
                  className="text-red-500 hover:text-red-700 text-xs sm:text-sm px-1.5 py-1 shrink-0 font-medium"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addFlavor}
            className="mt-4 text-xs sm:text-sm text-cocoa-700 hover:text-cocoa-900 font-medium flex items-center gap-1"
          >
            + 添加口味
          </button>
        </section>

        {/* 夹心 / 水果 Section */}
        <section className="mb-6 sm:mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl text-cocoa-900 mb-1">夹心 / 水果</h2>
          <p className="text-xs text-cocoa-400 mb-4">顾客下单时会从这些选项中选择两种（夹心1 和 夹心2）</p>
          <div className="space-y-3">
            {fillings.map((f, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-cocoa-50/30 rounded-xl border border-cocoa-100">
                <label className="shrink-0 relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-cocoa-200 bg-white cursor-pointer flex items-center justify-center text-cocoa-400 text-[10px] text-center">
                  {f.imageUrl ? (
                    <img src={f.imageUrl} alt={f.label} className="w-full h-full object-cover" />
                  ) : uploadingFillingIdx === i ? (
                    "上传中"
                  ) : (
                    "+ 图片"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFillingImage(i, e.target.files?.[0])}
                  />
                </label>
                <input
                  value={f.label}
                  onChange={(e) => updateFilling(i, "label", e.target.value)}
                  placeholder="例如：草莓"
                  className="flex-1 min-w-0 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />
                <button
                  onClick={() => removeFilling(i)}
                  className="text-red-500 hover:text-red-700 text-xs sm:text-sm px-1.5 py-1 shrink-0 font-medium"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addFilling}
            className="mt-4 text-xs sm:text-sm text-cocoa-700 hover:text-cocoa-900 font-medium flex items-center gap-1"
          >
            + 添加夹心/水果
          </button>
        </section>

        {/* Save Bar (Sticky on Mobile) */}
        <div className="fixed sm:relative bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-0 border-cocoa-100 flex items-center justify-between sm:justify-start gap-4 z-20">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto rounded-xl bg-cocoa-800 text-cream px-8 py-3 text-sm font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60 shadow-sm active:scale-95"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
          {message && <span className="text-sm font-medium text-cocoa-700 shrink-0">{message}</span>}
        </div>
      </main>
    </div>
  );
}
