"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cldThumb } from "@/lib/cloudinary-url";
import OrderReceiptCard from "@/components/OrderReceiptCard";

export default function OrderModal({ photo, folderId, folderName, onClose }) {
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [wechatName, setWechatName] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [flavor, setFlavor] = useState("");
  const [filling1, setFilling1] = useState("");
  const [filling2, setFilling2] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    fetch("/api/order-options")
      .then((res) => res.json())
      .then((data) => {
        setOptions(data.options);
        if (data.options?.sizes?.length) setSizeLabel(data.options.sizes[0].label);
        if (data.options?.flavors?.length) setFlavor(data.options.flavors[0].label);
        if (data.options?.fillings?.length) {
          setFilling1(data.options.fillings[0].label);
          setFilling2((data.options.fillings[1] || data.options.fillings[0]).label);
        }
      })

    const savedPhone = localStorage.getItem("memory_cake_phone");
    if (savedPhone) setPhone(savedPhone);

    const savedWechat = localStorage.getItem("memory_cake_wechat_name");
    if (savedWechat) setWechatName(savedWechat);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selectedSize = options?.sizes?.find((s) => s.label === sizeLabel);

  function imageForLabel(list, label) {
    return list?.find((item) => item.label === label)?.imageUrl || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!wechatName.trim()) {
      setError("请填写微信账号名");
      return;
    }
    if (!deliveryPlace.trim() || !phone.trim()) {
      setError("请填写配送地址和联系电话");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: photo.id,
          folderId,
          photoUrl: photo.url,
          folderName,
          wechatName: wechatName.trim(),
          sizeLabel,
          sizePrice: selectedSize?.price,
          flavor,
          flavorImageUrl: imageForLabel(options?.flavors, flavor),
          filling1,
          filling1ImageUrl: imageForLabel(options?.fillings, filling1),
          filling2,
          filling2ImageUrl: imageForLabel(options?.fillings, filling2),
          deliveryDate,
          deliveryTime,
          deliveryPlace: deliveryPlace.trim(),
          phone: phone.trim(),
          remark: remark.trim(),
        }),
      });

      // Remember this device's phone + WeChat name so future orders and
      // the chat widgets don't need to ask again.
      localStorage.setItem("memory_cake_phone", phone.trim());
      localStorage.setItem("memory_cake_wechat_name", wechatName.trim());

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "提交失败，请稍后重试");
      }

      const data = await res.json();

      setSubmittedOrder({
        id: data.order.id,
        createdAt: data.order.created_at,
        wechatName: wechatName.trim(),
        sizeLabel,
        sizePrice: selectedSize?.price,
        flavor,
        flavorImageUrl: imageForLabel(options?.flavors, flavor),
        filling1,
        filling1ImageUrl: imageForLabel(options?.fillings, filling1),
        filling2,
        filling2ImageUrl: imageForLabel(options?.fillings, filling2),
        deliveryDate,
        deliveryTime,
        deliveryPlace: deliveryPlace.trim(),
        phone: phone.trim(),
        remark: remark.trim(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-3 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-cream rounded-2xl shadow-soft max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!submittedOrder && (
          <div className="relative">
            <div className="relative w-full aspect-[4/3] bg-cocoa-100 rounded-t-2xl overflow-hidden">
              <Image
                src={cldThumb(photo.url, 600)}
                alt={photo.caption || "蛋糕图片"}
                fill
                sizes="500px"
                className="object-cover"
              />
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xl"
              aria-label="关闭"
            >
              &times;
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6">
          {!submittedOrder && (
            <>
              <h2 className="font-serif font-medium text-2xl text-cocoa-900 mb-1">订购这款蛋糕</h2>
              <p className="text-xs text-cocoa-400 mb-5">
                填写以下信息，我们会尽快与您联系确认订单
              </p>
            </>
          )}

          {submittedOrder ? (
            <div>
              <div className="text-center mb-4">
                <p className="font-serif text-lg text-cocoa-900 mb-1">订购信息已提交！🎂</p>
                <p className="text-xs text-cocoa-500">
                  我们会尽快通过您留下的电话与您联系。这是您的订购卡片：
                </p>
              </div>

              <OrderReceiptCard order={submittedOrder} photoUrl={photo.url} />

              <button
                onClick={onClose}
                className="w-full mt-4 rounded-lg border border-cocoa-200 text-cocoa-500 py-2.5 text-sm hover:bg-cocoa-50 transition-colors"
              >
                关闭
              </button>
            </div>
          ) : loadingOptions ? (
            <p className="text-cocoa-400 text-sm py-8 text-center">加载中...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  微信账号名 *
                </label>
                <input
                  type="text"
                  value={wechatName}
                  onChange={(e) => setWechatName(e.target.value)}
                  placeholder="请输入您的微信昵称或账号名"
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                  尺寸 *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(options?.sizes || []).map((s) => (
                    <button
                      type="button"
                      key={s.label}
                      onClick={() => setSizeLabel(s.label)}
                      className={`rounded-lg border px-2 py-2.5 text-sm text-center transition-colors ${
                        sizeLabel === s.label
                          ? "border-cocoa-800 bg-cocoa-800 text-cream"
                          : "border-cocoa-200 bg-white text-cocoa-700 hover:border-cocoa-400"
                      }`}
                    >
                      <div className="font-medium">{s.label}</div>
                      <div className={`text-[11px] mt-0.5 ${sizeLabel === s.label ? "text-cream/80" : "text-cocoa-400"}`}>
                        MMK{s.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              // after
              {options?.flavors?.length > 0 && (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                    口味
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {options.flavors.map((f) => (
                      <button
                        type="button"
                        key={f.label}
                        onClick={() => setFlavor(f.label)}
                        className={`rounded-lg border overflow-hidden text-center transition-colors ${
                          flavor === f.label
                            ? "border-cocoa-800 ring-2 ring-cocoa-800"
                            : "border-cocoa-200 hover:border-cocoa-400"
                        }`}
                      >
                        {f.imageUrl ? (
                          <div className="relative w-full aspect-square bg-cocoa-100">
                            <Image src={cldThumb(f.imageUrl, 200)} alt={f.label} fill sizes="120px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-full aspect-square bg-cocoa-100 flex items-center justify-center text-2xl">🎂</div>
                        )}
                        <div className={`py-1.5 text-xs font-medium ${flavor === f.label ? "bg-cocoa-800 text-cream" : "bg-white text-cocoa-700"}`}>
                          {f.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {options?.fillings?.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                      夹心 / 水果 1
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {options.fillings.map((f) => (
                        <button
                          type="button"
                          key={f.label}
                          onClick={() => setFilling1(f.label)}
                          className={`rounded-lg border overflow-hidden text-center transition-colors ${
                            filling1 === f.label
                              ? "border-cocoa-800 ring-2 ring-cocoa-800"
                              : "border-cocoa-200 hover:border-cocoa-400"
                          }`}
                        >
                          {f.imageUrl ? (
                            <div className="relative w-full aspect-square bg-cocoa-100">
                              <Image src={cldThumb(f.imageUrl, 200)} alt={f.label} fill sizes="120px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-cocoa-100 flex items-center justify-center text-2xl">🍓</div>
                          )}
                          <div className={`py-1.5 text-xs font-medium ${filling1 === f.label ? "bg-cocoa-800 text-cream" : "bg-white text-cocoa-700"}`}>
                            {f.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                      夹心 / 水果 2
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {options.fillings.map((f) => (
                        <button
                          type="button"
                          key={f.label}
                          onClick={() => setFilling2(f.label)}
                          className={`rounded-lg border overflow-hidden text-center transition-colors ${
                            filling2 === f.label
                              ? "border-cocoa-800 ring-2 ring-cocoa-800"
                              : "border-cocoa-200 hover:border-cocoa-400"
                          }`}
                        >
                          {f.imageUrl ? (
                            <div className="relative w-full aspect-square bg-cocoa-100">
                              <Image src={cldThumb(f.imageUrl, 200)} alt={f.label} fill sizes="120px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-cocoa-100 flex items-center justify-center text-2xl">🍓</div>
                          )}
                          <div className={`py-1.5 text-xs font-medium ${filling2 === f.label ? "bg-cocoa-800 text-cream" : "bg-white text-cocoa-700"}`}>
                            {f.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                    取货/配送日期
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                    期望时间
                  </label>
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  配送地址 *
                </label>
                <input
                  type="text"
                  value={deliveryPlace}
                  onChange={(e) => setDeliveryPlace(e.target.value)}
                  placeholder="请输入配送地址或到店自取"
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  联系电话 *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号码"
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  备注
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="如有蛋糕上的文字、特殊要求等，请在此说明"
                  rows={3}
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-cocoa-800 text-cream py-3 font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60"
              >
                {submitting ? "提交中..." : "提交订购"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
