"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1550;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadImageSafe(src) {
  if (!src) return null;
  try {
    return await loadImage(src);
  } catch {
    return null;
  }
}

export default function OrderReceiptCard({ order, photoUrl }) {
  const { lang, t } = useLang();
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [failed, setFailed] = useState(false);

  // English text when in English mode and the admin filled it in.
  const L = (zh, en) => (lang === "en" && en ? en : zh);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setGenerating(true);
    setFailed(false);

    try {
      await Promise.all([
        document.fonts.load("700 44px 'Cormorant Garamond'").catch(() => {}),
        document.fonts.load("600 24px 'Inter'").catch(() => {}),
      ]);

      const canvas = canvasRef.current;
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext("2d");

      const isDessert = !order.flavor && !order.filling1 && !order.filling2;

      // Soft Light Cream Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
      bgGrad.addColorStop(0, "#ffffff");
      bgGrad.addColorStop(0.5, "#faf5ee");
      bgGrad.addColorStop(1, "#f6ede1");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Delicate Outer Golden Line Border
      ctx.strokeStyle = "#e5d7c5";
      ctx.lineWidth = 3;
      roundRect(ctx, 35, 35, CARD_WIDTH - 70, CARD_HEIGHT - 70, 28);
      ctx.stroke();

      // Header Block
      ctx.textAlign = "center";
      ctx.fillStyle = "#1a130e";
      ctx.font = "700 48px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("MEMORY CAKE", CARD_WIDTH / 2, 105);

      ctx.font = "600 22px Inter, sans-serif";
      ctx.fillStyle = "#7a5738";
      ctx.fillText(t("receipt.subtitle"), CARD_WIDTH / 2, 142);

      // ==========================================
      // TOP SECTION: Photo — single wide layer for dessert orders,
      // photo + 3 option chips for regular cake orders.
      // ==========================================
      const photoX = 70;
      const photoY = 185;
      const photoWidth = isDessert ? CARD_WIDTH - 140 : 520;
      const photoHeight = 520;

      ctx.fillStyle = "#f2e7d8";
      roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 24);
      ctx.fill();

      const cakeImg = await loadImageSafe(photoUrl);
      if (cakeImg) {
        ctx.save();
        roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 24);
        ctx.clip();

        const scale = Math.min(photoWidth / cakeImg.width, photoHeight / cakeImg.height);
        const dw = cakeImg.width * scale;
        const dh = cakeImg.height * scale;
        const dx = photoX + (photoWidth - dw) / 2;
        const dy = photoY + (photoHeight - dh) / 2;

        ctx.drawImage(cakeImg, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#7a5738";
        ctx.font = "500 64px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎂", photoX + photoWidth / 2, photoY + photoHeight / 2 + 20);
      }

      if (!isDessert) {
        const chipX = 630;
        const chipWidth = 195;
        const chipHeight = 135;
        const chipGap = 42;

        function drawOptionChip(yPos, label, img, fallbackEmoji) {
          ctx.save();
          ctx.shadowColor = "rgba(110, 85, 60, 0.08)";
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 4;

          ctx.fillStyle = "#faf3e8";
          roundRect(ctx, chipX, yPos, chipWidth, chipHeight, 20);
          ctx.fill();
          ctx.restore();

          ctx.strokeStyle = "#eee1d1";
          ctx.lineWidth = 1.5;
          roundRect(ctx, chipX, yPos, chipWidth, chipHeight, 20);
          ctx.stroke();

          if (img) {
            ctx.save();
            roundRect(ctx, chipX, yPos, chipWidth, chipHeight, 20);
            ctx.clip();
            const scale = Math.max(chipWidth / img.width, chipHeight / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            const dx = chipX + (chipWidth - dw) / 2;
            const dy = yPos + (chipHeight - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
          } else {
            ctx.fillStyle = "#7a5738";
            ctx.font = "500 42px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(fallbackEmoji, chipX + chipWidth / 2, yPos + chipHeight / 2 + 14);
          }

          ctx.textAlign = "center";
          ctx.font = "700 22px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#221912";
          ctx.fillText(label || "—", chipX + chipWidth / 2, yPos + chipHeight + 30);
        }

        const [flavorImg, filling1Img, filling2Img] = await Promise.all([
          loadImageSafe(order.flavorImageUrl),
          loadImageSafe(order.filling1ImageUrl),
          loadImageSafe(order.filling2ImageUrl),
        ]);

        drawOptionChip(photoY, L(order.flavor, order.flavorEn), flavorImg, "🍫");
        drawOptionChip(photoY + chipHeight + chipGap, L(order.filling1, order.filling1En), filling1Img, "🍓");
        drawOptionChip(photoY + (chipHeight + chipGap) * 2, L(order.filling2, order.filling2En), filling2Img, "🫐");
      }

      // ==========================================
      // BOTTOM SECTION: Order Details
      // ==========================================
      let currentY = photoY + photoHeight + 110;

      function wrapRightText(text, rightXPos, startY, maxWidth, lineHeight) {
        const chars = String(text).split("");
        let line = "";
        const lines = [];
        for (const ch of chars) {
          const test = line + ch;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = ch;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        lines.forEach((l, idx) => ctx.fillText(l, rightXPos, startY + idx * lineHeight));
        return lines.length;
      }

      function renderDetailRow(label, value) {
        if (!value) return;

        const leftX = 75;
        const rightXPos = CARD_WIDTH - 75;
        const maxValWidth = CARD_WIDTH - 320;

        ctx.textAlign = "left";
        ctx.font = "700 23px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#63472d";
        ctx.fillText(label, leftX, currentY);

        ctx.textAlign = "right";
        ctx.font = "700 26px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#1e1610";

        const lineHeight = 38;
        const lineCount = wrapRightText(value, rightXPos, currentY, maxValWidth, lineHeight);
        currentY += Math.max(lineCount * lineHeight, 36) + 24;
      }

      // Highlighted price-style row: "<mainText>  MMK <price>" with the
      // price portion in the warm burgundy/gold accent.
      function renderPriceRow(label, mainText, price) {
        if (!mainText) return;

        const leftX = 75;
        const rightXPos = CARD_WIDTH - 75;

        ctx.textAlign = "left";
        ctx.font = "700 23px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#63472d";
        ctx.fillText(label, leftX, currentY);

        ctx.textAlign = "right";
        const pricePart = price ? `  MMK ${price}` : "";
        const fullText = `${mainText}${pricePart}`;
        const parts = fullText.split("MMK");

        if (parts.length > 1) {
          ctx.fillStyle = "#221912";
          ctx.font = "700 38px 'Cormorant Garamond', Georgia, serif";
          ctx.fillText(parts[0], rightXPos - ctx.measureText(`MMK ${parts[1]}`).width, currentY);

          ctx.fillStyle = "#7a2a16";
          ctx.font = "700 34px 'Cormorant Garamond', Georgia, serif";
          ctx.fillText(`MMK ${parts[1]}`, rightXPos, currentY);
        } else {
          ctx.fillStyle = "#221912";
          ctx.font = "700 36px 'Cormorant Garamond', Georgia, serif";
          ctx.fillText(fullText, rightXPos, currentY);
        }

        currentY += 56;
      }

      // Render Order Detail Rows
      renderDetailRow(t("receipt.wechat"), order.wechatName);
      renderPriceRow(
        isDessert ? t("receipt.item") : t("receipt.size"),
        L(order.sizeLabel, order.sizeLabelEn),
        order.sizePrice
      );

      if (isDessert && order.quantity) {
        renderDetailRow(t("receipt.qty"), t("receipt.qtyValue", { n: order.quantity }));
        if (order.totalPrice) {
          renderPriceRow(t("receipt.total"), t("receipt.totalOf", { n: order.quantity }), order.totalPrice);
        }
      }

      renderDetailRow(t("receipt.date"), [order.deliveryDate, order.deliveryTime].filter(Boolean).join("  "));
      renderDetailRow(t("receipt.address"), order.deliveryPlace);
      renderDetailRow(t("receipt.phone"), order.phone);
      if (order.remark) renderDetailRow(t("receipt.note"), order.remark);

      // ==========================================
      // FOOTER SECTION
      // ==========================================
      const orderDate = new Date(order.createdAt || Date.now());

      ctx.textAlign = "center";
      ctx.font = "600 20px Inter, sans-serif";
      ctx.fillStyle = "#7a5738";
      ctx.fillText(
        t("receipt.orderNo", {
          id: order.id || "8",
          date: orderDate.toLocaleDateString(lang === "en" ? "en-GB" : "zh-CN"),
        }),
        CARD_WIDTH / 2,
        CARD_HEIGHT - 95
      );

      ctx.font = "600 22px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = "#593d24";
      ctx.fillText(t("receipt.thanks"), CARD_WIDTH / 2, CARD_HEIGHT - 60);

      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
    } catch {
      setFailed(true);
    } finally {
      setGenerating(false);
    }
  }

  function handleSave() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `memory-cake-order-${order.id || Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShare() {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "memory-cake-order.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("receipt.shareTitle"),
          text: t("receipt.shareText"),
        });
        return;
      }
    } catch {
      // Fallback to save if Web Share API is unavailable
    }
    handleSave();
  }

  return (
    <div className="text-center max-w-md mx-auto px-2">
      <canvas ref={canvasRef} className="hidden" />

      {generating && (
        <div className="py-20 text-amber-900/60 text-base font-semibold animate-pulse">
          {t("receipt.generating")}
        </div>
      )}

      {!generating && failed && (
        <div className="py-12">
          <p className="text-base text-amber-950 font-medium mb-4">{t("receipt.failed")}</p>
          <button
            onClick={generate}
            className="rounded-xl bg-amber-900 text-amber-50 px-6 py-3 text-base font-semibold shadow-md active:scale-95 transition-transform"
          >
            {t("receipt.retry")}
          </button>
        </div>
      )}

      {!generating && !failed && dataUrl && (
        <>
          <div className="overflow-hidden rounded-2xl shadow-2xl border border-amber-200/50 mb-6">
            <img src={dataUrl} alt={t("receipt.alt")} className="w-full block" />
          </div>
          <div className="flex gap-3 justify-center pb-4">
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-amber-900 text-amber-50 py-3.5 text-base font-semibold hover:bg-amber-950 active:scale-98 transition-all shadow-md"
            >
              {t("receipt.save")}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border-2 border-amber-800/20 text-amber-950 py-3.5 text-base font-semibold hover:bg-amber-100/50 active:scale-98 transition-all"
            >
              {t("receipt.share")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
