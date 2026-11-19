"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cldThumb } from "@/lib/cloudinary-url";
import OrderReceiptCard from "@/components/OrderReceiptCard";
import TownshipSelect from "@/components/TownshipSelect";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pickLang } from "@/lib/i18n/pick";

const fmtMMK = (n) => `MMK ${Number(n || 0).toLocaleString("en-US")}`;

export default function OrderModal({
  photo,
  folderId,
  folderName,
  folderNameEn = "",
  orderFormType = "cake",
  dessertOptions = [],
  minQuantity = 6,
  onClose,
}) {
  const router = useRouter();
  const { lang, t } = useLang();
  const isDessert = orderFormType === "dessert";

  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [wechatName, setWechatName] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [flavor, setFlavor] = useState("");
  const [filling1, setFilling1] = useState("");
  const [filling2, setFilling2] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [township, setTownship] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    if (isDessert) {
      if (dessertOptions?.length) setSizeLabel(dessertOptions[0].label);
      setQuantity(minQuantity);
    }

    // Always load the options: cake forms need sizes/flavors/fillings, and
    // both form types need the list of deliverable townships.
    fetch("/api/order-options", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setOptions(data.options);
        if (!isDessert) {
          if (data.options?.sizes?.length) setSizeLabel(data.options.sizes[0].label);
          if (data.options?.flavors?.length) setFlavor(data.options.flavors[0].label);
          if (data.options?.fillings?.length) {
            setFilling1(data.options.fillings[0].label);
            setFilling2(data.options.fillings[1]?.label || data.options.fillings[0].label);
          }
        }
        const savedTownship = localStorage.getItem("memory_cake_township");
        if (savedTownship && data.options?.townships?.some((x) => x.label === savedTownship)) {
          setTownship(savedTownship);
        }
      })
      .finally(() => setLoadingOptions(false));

    const savedPhone = localStorage.getItem("memory_cake_phone");
    if (savedPhone) setPhone(savedPhone);

    const savedWechat = localStorage.getItem("memory_cake_wechat_name");
    if (savedWechat) setWechatName(savedWechat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sizeChoices = isDessert ? dessertOptions : options?.sizes || [];
  const townships = options?.townships || [];
  const selectedSize = sizeChoices.find((s) => s.label === sizeLabel);
  const selectedTownship = townships.find((x) => x.label === township);
  const selectedFlavorOption = options?.flavors?.find((f) => f.label === flavor);
  const selectedFilling1Option = options?.fillings?.find((f) => f.label === filling1);
  const selectedFilling2Option = options?.fillings?.find((f) => f.label === filling2);

  // Payment = item price + delivery fee. Display only — the server
  // recalculates both from the database when the order is saved.
  const itemTotal = (Number(selectedSize?.price) || 0) * (isDessert ? quantity : 1);
  const deliveryFee = selectedTownship ? Number(selectedTownship.fee) || 0 : null;
  const grandTotal = deliveryFee === null ? null : itemTotal + deliveryFee;

  // Display text only. What gets saved with the order is always the
  // original (Chinese) label, so the admin side keeps working unchanged.
  const labelOf = (item) => pickLang(lang, item.label, item.labelEn);
  const sizeText = (s) => (isDessert ? pickLang(lang, s.label, folderNameEn) : labelOf(s));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!wechatName.trim()) {
      setError(t("order.errWechat"));
      return;
    }
    if (!sizeLabel) {
      setError(isDessert ? t("order.errFlavor") : t("order.errSize"));
      return;
    }
    if (isDessert && quantity < minQuantity) {
      setError(t("order.errMinQty", { n: minQuantity }));
      return;
    }
    if (!selectedTownship) {
      setError(t("order.errTownship"));
      return;
    }
    if (!deliveryPlace.trim() || !phone.trim()) {
      setError(t("order.errAddrPhone"));
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
          flavor: isDessert ? "" : flavor,
          filling1: isDessert ? "" : filling1,
          filling2: isDessert ? "" : filling2,
          quantity: isDessert ? quantity : 1,
          deliveryDate,
          deliveryTime,
          township: selectedTownship.label,
          deliveryPlace: deliveryPlace.trim(),
          phone: phone.trim(),
          remark: remark.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("order.errSubmit"));
      }

      localStorage.setItem("memory_cake_phone", phone.trim());
      localStorage.setItem("memory_cake_wechat_name", wechatName.trim());
      localStorage.setItem("memory_cake_township", selectedTownship.label);

      const data = await res.json();
      router.refresh();

      const saved = data.order;
      const savedFee = Number(saved.delivery_fee) || 0;
      const unit = Number(saved.size_price) || Number(selectedSize?.price) || 0;
      const subtotal = unit * (isDessert ? quantity : 1);

      setSubmittedOrder({
        id: saved.id,
        createdAt: saved.created_at,
        wechatName: wechatName.trim(),
        sizeLabel,
        sizeLabelEn: isDessert ? folderNameEn : selectedSize?.labelEn || "",
        sizePrice: unit,
        flavor: isDessert ? "" : flavor,
        flavorEn: isDessert ? "" : selectedFlavorOption?.labelEn || "",
        filling1: isDessert ? "" : filling1,
        filling1En: isDessert ? "" : selectedFilling1Option?.labelEn || "",
        filling2: isDessert ? "" : filling2,
        filling2En: isDessert ? "" : selectedFilling2Option?.labelEn || "",
        flavorImageUrl: isDessert ? null : selectedFlavorOption?.imageUrl || null,
        filling1ImageUrl: isDessert ? null : selectedFilling1Option?.imageUrl || null,
        filling2ImageUrl: isDessert ? null : selectedFilling2Option?.imageUrl || null,
        quantity: isDessert ? quantity : 1,
        subtotal,
        deliveryFee: savedFee,
        totalPrice: Number(saved.total_price) || subtotal + savedFee,
        township: selectedTownship.label,
        townshipEn: selectedTownship.labelEn || "",
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
                alt={photo.caption || t("order.photoAlt")}
                fill
                sizes="500px"
                className="object-cover"
              />
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xl"
              aria-label={t("common.close")}
            >
              &times;
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6">
          {!submittedOrder && (
            <>
              <h2 className="font-serif font-medium text-2xl text-cocoa-900 mb-1">
                {isDessert ? t("order.titleDessert") : t("order.titleCake")}
              </h2>
              <p className="text-xs text-cocoa-400 mb-5">{t("order.intro")}</p>
            </>
          )}

          {submittedOrder ? (
            <div>
              <div className="text-center mb-4">
                <p className="font-serif text-lg text-cocoa-900 mb-1">{t("order.submitted")}</p>
                <p className="text-xs text-cocoa-500">{t("order.submittedSub")}</p>
              </div>

              <OrderReceiptCard order={submittedOrder} photoUrl={photo.url} />

              <button
                onClick={onClose}
                className="w-full mt-4 rounded-lg border border-cocoa-200 text-cocoa-500 py-2.5 text-sm hover:bg-cocoa-50 transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          ) : loadingOptions ? (
            <p className="text-cocoa-400 text-sm py-8 text-center">{t("common.loading")}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  {t("order.wechat")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={wechatName}
                    onChange={(e) => setWechatName(e.target.value)}
                    placeholder={t("order.wechatPh")}
                    className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 pr-9 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                    required
                  />
                  {wechatName && (
                    <button
                      type="button"
                      onClick={() => setWechatName("")}
                      aria-label={t("order.clearWechat")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-cocoa-100 text-lg leading-none transition-colors"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                  {isDessert ? t("order.pickFlavor") : t("order.size")}
                </label>
                {sizeChoices.length === 0 ? (
                  <p className="text-sm text-cocoa-400">{t("order.noOptions")}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {sizeChoices.map((s) => (
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
                        <div className="font-medium">{sizeText(s)}</div>
                        <div className={`text-[11px] mt-0.5 ${sizeLabel === s.label ? "text-cream/80" : "text-cocoa-400"}`}>
                          MMK{s.price}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isDessert && (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                    {t("order.qty")}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg border border-cocoa-200 text-cocoa-700 hover:border-cocoa-400 text-lg font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 text-center rounded-lg border border-cocoa-200 bg-white px-2 py-2 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 rounded-lg border border-cocoa-200 text-cocoa-700 hover:border-cocoa-400 text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                  <p className={`text-xs mt-1.5 ${quantity < minQuantity ? "text-red-600" : "text-cocoa-400"}`}>
                    {quantity < minQuantity
                      ? t("order.minQtyLow", { n: minQuantity })
                      : t("order.minQtyOk", { n: minQuantity })}
                  </p>
                </div>
              )}

              {!isDessert && options?.flavors?.length > 0 && (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                    {t("order.flavor")}
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
                        <div className="relative w-full aspect-square bg-cocoa-100">
                          {f.imageUrl ? (
                            <Image src={cldThumb(f.imageUrl, 200)} alt={labelOf(f)} fill sizes="120px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cocoa-300 text-2xl">🍰</div>
                          )}
                        </div>
                        <div className={`py-1.5 text-xs font-medium ${flavor === f.label ? "bg-cocoa-800 text-cream" : "bg-white text-cocoa-700"}`}>
                          {labelOf(f)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isDessert && options?.fillings?.length > 0 && (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                    {t("order.filling1")}
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
                        <div className="relative w-full aspect-square bg-cocoa-100">
                          {f.imageUrl ? (
                            <Image src={cldThumb(f.imageUrl, 200)} alt={labelOf(f)} fill sizes="120px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cocoa-300 text-2xl">🍓</div>
                          )}
                        </div>
                        <div className={`py-1.5 text-xs font-medium ${filling1 === f.label ? "bg-cocoa-800 text-cream" : "bg-white text-cocoa-700"}`}>
                          {labelOf(f)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isDessert && options?.fillings?.length > 0 && (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                    {t("order.filling2")}
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
                        <div className="relative w-full aspect-square bg-cocoa-100">
                          {f.imageUrl ? (
                            <Image src={cldThumb(f.imageUrl, 200)} alt={labelOf(f)} fill sizes="120px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cocoa-300 text-2xl">🫐</div>
                          )}
                        </div>
                        <div className={`py-1.5 text-xs font-medium ${filling2 === f.label ? "bg-cocoa-800 text-cream" : "bg-white text-cocoa-700"}`}>
                          {labelOf(f)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                    {t("order.date")}
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
                    {t("order.time")}
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
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-2">
                  {t("order.township")}
                </label>
                <TownshipSelect townships={townships} value={township} onChange={setTownship} />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  {t("order.address")}
                </label>
                <input
                  type="text"
                  value={deliveryPlace}
                  onChange={(e) => setDeliveryPlace(e.target.value)}
                  placeholder={t("order.addressPh")}
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  {t("order.phone")}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("order.phonePh")}
                    className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 pr-9 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                    required
                  />
                  {phone && (
                    <button
                      type="button"
                      onClick={() => setPhone("")}
                      aria-label={t("order.clearPhone")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-cocoa-100 text-lg leading-none transition-colors"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
                  {t("order.remark")}
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={t("order.remarkPh")}
                  rows={3}
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />
              </div>

              {/* Payment summary: item price + delivery fee = total */}
              <div className="rounded-xl border border-cocoa-200 bg-white overflow-hidden shadow-card">
                <div className="px-4 py-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-cocoa-600">
                    <span>
                      {t("order.itemPrice")}
                      {isDessert && quantity > 1 ? ` × ${quantity}` : ""}
                    </span>
                    <span className="font-medium text-cocoa-900">{fmtMMK(itemTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-cocoa-600">
                    <span>{t("order.deliveryFee")}</span>
                    {deliveryFee === null ? (
                      <span className="text-cocoa-300">—</span>
                    ) : deliveryFee > 0 ? (
                      <span className="font-medium text-cocoa-900">{fmtMMK(deliveryFee)}</span>
                    ) : (
                      <span className="font-medium text-green-700">{t("order.free")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-cocoa-800 text-cream">
                  <span className="text-sm">{t("order.totalPay")}</span>
                  {grandTotal === null ? (
                    <span className="text-xs text-cream/60">{t("order.pickTownshipFirst")}</span>
                  ) : (
                    <span className="font-serif font-semibold text-xl">{fmtMMK(grandTotal)}</span>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting || townships.length === 0}
                className="w-full rounded-lg bg-cocoa-800 text-cream py-3 font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60"
              >
                {submitting ? t("order.submitting") : t("order.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
