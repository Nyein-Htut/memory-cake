"use client";

import { useEffect, useRef, useState } from "react";

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1500;

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
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setGenerating(true);
    setFailed(false);

    try {
      await Promise.all([
        document.fonts.load("700 42px 'Cormorant Garamond'").catch(() => {}),
        document.fonts.load("600 24px 'Inter'").catch(() => {}),
      ]);

      const canvas = canvasRef.current;
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext("2d");

      // Soft Light Cream Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
      bgGrad.addColorStop(0, "#fffdfa");
      bgGrad.addColorStop(0.6, "#fdf8f0");
      bgGrad.addColorStop(1, "#f9f1e4");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Outer Frame
      ctx.strokeStyle = "#e2cbaf";
      ctx.lineWidth = 3;
      roundRect(ctx, 30, 30, CARD_WIDTH - 60, CARD_HEIGHT - 60, 24);
      ctx.stroke();

      // Header Block
      ctx.textAlign = "center";
      ctx.fillStyle = "#1f1610";
      ctx.font = "700 44px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("MEMORY CAKE", CARD_WIDTH / 2, 95);

      ctx.font = "600 22px Inter, sans-serif";
      ctx.fillStyle = "#8a5c32";
      ctx.fillText("记忆蛋糕坊 · 订购确认单", CARD_WIDTH / 2, 132);

      // ---- Side-by-Side Top Section Layout ----
      const leftMargin = 75;
      const topSectionY = 165;

      // Left: Main Cake Photo
      const photoWidth = 470;
      const photoHeight = 480;

      ctx.fillStyle = "#f3e7d7";
      roundRect(ctx, leftMargin, topSectionY, photoWidth, photoHeight, 20);
      ctx.fill();

      const cakeImg = await loadImageSafe(photoUrl);
      if (cakeImg) {
        ctx.save();
        roundRect(ctx, leftMargin, topSectionY, photoWidth, photoHeight, 20);
        ctx.clip();
        const scale = Math.min(photoWidth / cakeImg.width, photoHeight / cakeImg.height);
        const dw = cakeImg.width * scale;
        const dh = cakeImg.height * scale;
        const dx = leftMargin + (photoWidth - dw) / 2;
        const dy = topSectionY + (photoHeight - dh) / 2;
        ctx.drawImage(cakeImg, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#8a5c32";
        ctx.font = "500 52px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎂", leftMargin + photoWidth / 2, topSectionY + photoHeight / 2 + 18);
      }

      // Right: 3 Vertical Option Chips (Flavor & Fillings)
      const rightX = 580;
      const chipWidth = 245;
      const chipHeight = 120;
      const chipGap = 20;

      function drawChip(x, y, label, img, fallbackEmoji) {
        // Soft rounded card box
        ctx.fillStyle = "#fdf5ea";
        roundRect(ctx, x, y, chipWidth, chipHeight, 18);
        ctx.fill();

        ctx.strokeStyle = "#eedbc5";
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, y, chipWidth, chipHeight, 18);
        ctx.stroke();

        // Image / Emoji
        if (img) {
          ctx.save();
          roundRect(ctx, x, y, chipWidth, chipHeight, 18);
          ctx.clip();
          const scale = Math.max(chipWidth / img.width, chipHeight / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = x + (chipWidth - dw) / 2;
          const dy = y + (chipHeight - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
        } else {
          ctx.fillStyle = "#8a5c32";
          ctx.font = "500 36px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(fallbackEmoji, x + chipWidth / 2, y + chipHeight / 2 - 4);
        }

        // Label below each box
        ctx.textAlign = "center";
        ctx.font = "700 22px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#1f1610";
        ctx.fillText(label || "—", x + chipWidth / 2, y + chipHeight + 28);
      }

      const [flavorImg, filling1Img, filling2Img] = await Promise.all([
        loadImageSafe(order.flavorImageUrl),
        loadImageSafe(order.filling1ImageUrl),
        loadImageSafe(order.filling2ImageUrl),
      ]);

      drawChip(rightX, topSectionY, order.flavor, flavorImg, "🍫");
      drawChip(rightX, topSectionY + (chipHeight + chipGap + 20), order.filling1, filling1Img, "🍓");
      drawChip(rightX, topSectionY + (chipHeight + chipGap + 20) * 2, order.filling2, filling2Img, "🫐");

      // ---- Text Details Table ----
      let currentY = topSectionY + photoHeight + 80;

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

      function renderDetailRow(label, value, options = {}) {
        if (!value) return;

        const { isPrice = false } = options;
        const leftX = 75;
        const rightXPos = CARD_WIDTH - 75;
        const maxValWidth = CARD_WIDTH - 320;

        // Label (Left)
        ctx.textAlign = "left";
        ctx.font = "700 22px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#6e4a2c";
        ctx.fillText(label, leftX, currentY);

        // Value (Right)
        ctx.textAlign = "right";
        ctx.font = isPrice
          ? "700 38px 'Cormorant Garamond', Georgia, serif"
          : "700 28px Inter, system-ui, sans-serif";
        ctx.fillStyle = isPrice ? "#9a3311" : "#1f1610";

        const lineHeight = isPrice ? 44 : 38;
        const lineCount = wrapRightText(value, rightXPos, currentY, maxValWidth, lineHeight);

        currentY += Math.max(lineCount * lineHeight, 36) + 22;
      }

      const priceText = order.sizePrice ? `  MMK ${order.sizePrice}` : "";
      renderDetailRow("尺寸 SIZE", `${order.sizeLabel}${priceText}`, { isPrice: true });
      renderDetailRow("日期 DATE", [order.deliveryDate, order.deliveryTime].filter(Boolean).join("  "));
      renderDetailRow("地址 ADDRESS", order.deliveryPlace);
      renderDetailRow("电话 PHONE", order.phone);
      if (order.remark) renderDetailRow("备注 NOTE", order.remark);

      // Footer Info
      const orderDate = new Date(order.createdAt || Date.now());

      ctx.textAlign = "center";
      ctx.font = "600 20px Inter, sans-serif";
      ctx.fillStyle = "#8a5c32";
      ctx.fillText(
        `订单编号 #${order.id || "—"}  ·  ${orderDate.toLocaleDateString("zh-CN")}`,
        CARD_WIDTH / 2,
        CARD_HEIGHT - 90
      );

      ctx.font = "600 22px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = "#5c3d22";
      ctx.fillText("— 感谢您的订购，期待为您制作 🎂 —", CARD_WIDTH / 2, CARD_HEIGHT - 55);

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
          title: "Memory Cake 蛋糕订购",
          text: "我在Memory Cake订购了这款蛋糕！",
        });
        return;
      }
    } catch {
      // fall through
    }
    handleSave();
  }

  return (
    <div className="text-center max-w-md mx-auto px-2">
      <canvas ref={canvasRef} className="hidden" />

      {generating && (
        <div className="py-20 text-amber-900/60 text-base font-semibold animate-pulse">
          正在生成清晰订单卡片...
        </div>
      )}

      {!generating && failed && (
        <div className="py-12">
          <p className="text-base text-amber-950 font-medium mb-4">卡片生成失败，请重试。</p>
          <button
            onClick={generate}
            className="rounded-xl bg-amber-900 text-amber-50 px-6 py-3 text-base font-semibold shadow-md active:scale-95 transition-transform"
          >
            重新生成
          </button>
        </div>
      )}

      {!generating && !failed && dataUrl && (
        <>
          <div className="overflow-hidden rounded-2xl shadow-2xl border border-amber-200/50 mb-6">
            <img src={dataUrl} alt="订单卡片" className="w-full block" />
          </div>
          <div className="flex gap-3 justify-center pb-4">
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-amber-900 text-amber-50 py-3.5 text-base font-semibold hover:bg-amber-950 active:scale-98 transition-all shadow-md"
            >
              💾 保存图片
            </button>
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border-2 border-amber-800/20 text-amber-950 py-3.5 text-base font-semibold hover:bg-amber-100/50 active:scale-98 transition-all"
            >
              📤 分享卡片
            </button>
          </div>
        </>
      )}
    </div>
  );
}
