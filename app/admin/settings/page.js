"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { uploadOptionImage } from "@/lib/uploadOptionImage";

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function TruckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h11v10H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}

const digitsOnly = (v) => v.replace(/[^0-9]/g, "");

const inputCls =
  "w-full min-w-0 rounded-lg border border-cocoa-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white";

export default function AdminSettingsPage() {
  const [sizes, setSizes] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [fillings, setFillings] = useState([]);
  const [townships, setTownships] = useState([]);
  const [newTownship, setNewTownship] = useState({ label: "", labelEn: "", labelMy: "", fee: "" });
  const [townshipError, setTownshipError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/order-options", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSizes(data.options?.sizes || []);
        setFlavors(data.options?.flavors || []);
        setFillings(data.options?.fillings || []);
        setTownships(data.options?.townships || []);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateSize(i, field, value) {
    setSizes((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  // Price inputs are plain text fields that only ever keep digits. A
  // type="number" input reformats on every keystroke (cursor/leading-zero
  // jumps) and silently changes value on scroll-wheel — this avoids both.
  function updateSizePrice(i, rawValue) {
    const digits = digitsOnly(rawValue);
    updateSize(i, "price", digits === "" ? "" : Number(digits));
  }

  function addSize() {
    setSizes((prev) => [...prev, { label: "", labelEn: "", labelMy: "", price: 0 }]);
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
    setFlavors((prev) => [...prev, { label: "", labelEn: "", labelMy: "", imageUrl: null }]);
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
    setFillings((prev) => [...prev, { label: "", labelEn: "", labelMy: "", imageUrl: null }]);
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

  // ---- Delivery townships ----
  function updateTownship(i, field, value) {
    setTownships((prev) => prev.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  }
  function removeTownship(i) {
    setTownships((prev) => prev.filter((_, idx) => idx !== i));
  }
  function handleAddTownship(e) {
    e.preventDefault();
    const label = newTownship.label.trim();
    if (!label) {
      setTownshipError("请填写区域名称");
      return;
    }
    if (townships.some((x) => x.label.trim() === label)) {
      setTownshipError("该区域已存在");
      return;
    }
    setTownships((prev) => [
      ...prev,
      {
        label,
        labelEn: newTownship.labelEn.trim(),
        labelMy: newTownship.labelMy.trim(),
        fee: newTownship.fee === "" ? 0 : Number(newTownship.fee),
      },
    ]);
    setNewTownship({ label: "", labelEn: "", labelMy: "", fee: "" });
    setTownshipError("");
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
        townships: townships
          .filter((x) => x.label.trim())
          .map((x) => ({ ...x, fee: Number(x.fee) || 0 })),
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
          管理下单表单中可供顾客选择的尺寸、价格、口味和夹心/水果选项。英文和缅文名称为选填，留空时缅文模式显示英文，英文模式显示中文。
        </p>

        {/* 尺寸与价格 Section */}
        <section className="mb-6 sm:mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl text-cocoa-900 mb-4">尺寸与价格</h2>
          <div className="space-y-3">
            {sizes.map((s, i) => (
              <div key={i} className="p-2.5 sm:p-3 bg-cocoa-50/30 rounded-xl border border-cocoa-100 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={s.label}
                    onChange={(e) => updateSize(i, "label", e.target.value)}
                    placeholder="中文：6寸"
                    className={`flex-1 ${inputCls}`}
                  />
                  <input
                    value={s.labelEn || ""}
                    onChange={(e) => updateSize(i, "labelEn", e.target.value)}
                    placeholder="English: 6 inch"
                    className={`flex-1 ${inputCls}`}
                  />
                </div>
                <input
                  value={s.labelMy || ""}
                  onChange={(e) => updateSize(i, "labelMy", e.target.value)}
                  placeholder="မြန်မာ: ၆ လက်မ"
                  className={inputCls}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-cocoa-500 text-xs font-medium shrink-0">MMK</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={s.price}
                      onChange={(e) => updateSizePrice(i, e.target.value)}
                      className="w-28 rounded-lg border border-cocoa-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={() => removeSize(i)}
                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm px-1.5 py-1 shrink-0 font-medium"
                  >
                    删除
                  </button>
                </div>
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
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    value={f.label}
                    onChange={(e) => updateFlavor(i, "label", e.target.value)}
                    placeholder="中文：巧克力"
                    className={inputCls}
                  />
                  <input
                    value={f.labelEn || ""}
                    onChange={(e) => updateFlavor(i, "labelEn", e.target.value)}
                    placeholder="English: Chocolate"
                    className={inputCls}
                  />
                  <input
                    value={f.labelMy || ""}
                    onChange={(e) => updateFlavor(i, "labelMy", e.target.value)}
                    placeholder="မြန်မာ: ချော့ကလက်"
                    className={inputCls}
                  />
                </div>
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
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    value={f.label}
                    onChange={(e) => updateFilling(i, "label", e.target.value)}
                    placeholder="中文：草莓"
                    className={inputCls}
                  />
                  <input
                    value={f.labelEn || ""}
                    onChange={(e) => updateFilling(i, "labelEn", e.target.value)}
                    placeholder="English: Strawberry"
                    className={inputCls}
                  />
                  <input
                    value={f.labelMy || ""}
                    onChange={(e) => updateFilling(i, "labelMy", e.target.value)}
                    placeholder="မြန်မာ: စတော်ဘယ်ရီ"
                    className={inputCls}
                  />
                </div>
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

        {/* 配送区域 Section */}
        <section className="mb-6 sm:mb-8 bg-white rounded-2xl border border-cocoa-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-gradient-to-br from-cocoa-800 to-cocoa-950 text-cream">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-cream/15 shrink-0">
                <TruckIcon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-lg sm:text-xl leading-tight">配送区域</h2>
                <p className="text-[11px] text-cream/60">仅限已添加的区域可配送</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-cream/15 px-3 py-1 text-xs font-medium">
              {townships.length} 个区域
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {/* Add form */}
            <form
              onSubmit={handleAddTownship}
              className="rounded-xl border border-dashed border-cocoa-300 bg-cocoa-50/40 p-3 sm:p-4 mb-5"
            >
              <p className="text-xs font-medium text-cocoa-600 mb-2.5">新增区域</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  value={newTownship.label}
                  onChange={(e) => {
                    setNewTownship((p) => ({ ...p, label: e.target.value }));
                    setTownshipError("");
                  }}
                  placeholder="中文：茵雅湖"
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />
                <input
                  value={newTownship.labelEn}
                  onChange={(e) => setNewTownship((p) => ({ ...p, labelEn: e.target.value }))}
                  placeholder="English: Inya Lake"
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />
                <input
                  value={newTownship.labelMy}
                  onChange={(e) => setNewTownship((p) => ({ ...p, labelMy: e.target.value }))}
                  placeholder="မြန်မာ: အင်းယားကန်"
                  className="w-full rounded-lg border border-cocoa-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0 rounded-lg border border-cocoa-200 bg-white pl-3 focus-within:ring-2 focus-within:ring-cocoa-500">
                  <span className="text-cocoa-500 text-xs font-medium shrink-0">MMK</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newTownship.fee}
                    onChange={(e) => setNewTownship((p) => ({ ...p, fee: digitsOnly(e.target.value) }))}
                    placeholder="配送费（0 = 免费）"
                    className="w-full min-w-0 bg-transparent px-1 py-2 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-cocoa-800 text-cream px-5 py-2 text-sm font-medium hover:bg-cocoa-900 transition-colors active:scale-95"
                >
                  + 添加
                </button>
              </div>
              {townshipError && <p className="text-xs text-red-600 mt-2">{townshipError}</p>}
            </form>

            {/* List */}
            {townships.length === 0 ? (
              <div className="rounded-xl border border-cocoa-100 bg-cocoa-50/30 py-8 text-center">
                <PinIcon className="w-7 h-7 mx-auto text-cocoa-300 mb-2" />
                <p className="text-sm text-cocoa-400">暂无配送区域</p>
              </div>
            ) : (
              <div className="space-y-3">
                {townships.map((x, i) => {
                  const free = !(Number(x.fee) > 0);
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-cocoa-100 bg-white shadow-sm hover:border-cocoa-300 transition-colors p-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-cocoa-100 text-cocoa-600 shrink-0">
                          <PinIcon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="grid gap-2 sm:grid-cols-3">
                            <input
                              value={x.label}
                              onChange={(e) => updateTownship(i, "label", e.target.value)}
                              placeholder="中文名称"
                              className={inputCls}
                            />
                            <input
                              value={x.labelEn || ""}
                              onChange={(e) => updateTownship(i, "labelEn", e.target.value)}
                              placeholder="English name"
                              className={inputCls}
                            />
                            <input
                              value={x.labelMy || ""}
                              onChange={(e) => updateTownship(i, "labelMy", e.target.value)}
                              placeholder="မြန်မာအမည်"
                              className={inputCls}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-cocoa-500 text-xs font-medium shrink-0">MMK</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={x.fee}
                                  onChange={(e) => {
                                    const d = digitsOnly(e.target.value);
                                    updateTownship(i, "fee", d === "" ? "" : Number(d));
                                  }}
                                  className="w-28 rounded-lg border border-cocoa-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                                />
                              </div>
                              {free && (
                                <span className="rounded-full bg-green-50 text-green-700 text-[11px] font-medium px-2 py-0.5 whitespace-nowrap">
                                  免费
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeTownship(i)}
                              className="text-red-500 hover:text-red-700 text-xs sm:text-sm px-1.5 py-1 shrink-0 font-medium"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
