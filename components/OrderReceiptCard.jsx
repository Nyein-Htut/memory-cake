"use client";

import { useEffect, useRef, useState } from "react";

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1300;

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
        document.fonts.load("600 40px 'Cormorant Garamond'").catch(() => {}),
        document.fonts.load("italic 400 20px 'Cormorant Garamond'").catch(() => {}),
      ]);

      const canvas = canvasRef.current;
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext("2d");

      // Luxurious creamy gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
      bgGrad.addColorStop(0, "#fdf8f3");
      bgGrad.addColorStop(0.5, "#fbf1e2");
      bgGrad.addColorStop(1, "#f2e2c9");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Gold double border
      ctx.strokeStyle = "#d4ac86";
      ctx.lineWidth = 3;
      roundRect(ctx, 20, 20, CARD_WIDTH - 40, CARD_HEIGHT - 40, 26);
      ctx.stroke();
      ctx.strokeStyle = "rgba(212,172,134,0.45)";
      ctx.lineWidth = 1;
      roundRect(ctx, 36, 36, CARD_WIDTH - 72, CARD_HEIGHT - 72, 20);
      ctx.stroke();

      // Header
      ctx.textAlign = "center";
      ctx.fillStyle = "#3f2f24";
      ctx.font = "600 30px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("MEMORY CAKE 记忆蛋糕坊", CARD_WIDTH / 2, 92);

      ctx.font = "italic 400 17px Georgia, serif";
      ctx.fillStyle = "#9c6f45";
      ctx.fillText("— 蛋糕订购确认 Order Confirmation —", CARD_WIDTH / 2, 120);

      ctx.strokeStyle = "#d4ac86";
      ctx.beginPath();
      ctx.moveTo(CARD_WIDTH / 2 - 70, 142);
      ctx.lineTo(CARD_WIDTH / 2 + 70, 142);
      ctx.stroke();

      // Photo
      const photoTop = 172;
      const photoSize = CARD_WIDTH - 160;
      const photoX = (CARD_WIDTH - photoSize) / 2;

      try {
        const img = await loadImage(photoUrl);
        ctx.save();
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 22);
        ctx.clip();

        const scale = Math.max(photoSize / img.width, photoSize / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = photoX + (photoSize - dw) / 2;
        const dy = photoTop + (photoSize - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 7;
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 22);
        ctx.stroke();
        ctx.strokeStyle = "rgba(63,47,36,0.15)";
        ctx.lineWidth = 1;
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 22);
        ctx.stroke();
      } catch {
        ctx.fillStyle = "#f0e6da";
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 22);
        ctx.fill();
        ctx.fillStyle = "#b98a5e";
        ctx.font = "500 20px 'Cormorant Garamond', serif";
        ctx.textAlign = "center";
        ctx.fillText("🎂", CARD_WIDTH / 2, photoTop + photoSize / 2);
      }

      // Details
      let y = photoTop + photoSize + 62;

      function wrapRight(text, rightX, startY, maxWidth, lineHeight) {
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
        lines.forEach((l, idx) => ctx.fillText(l, rightX, startY + idx * lineHeight));
        return lines.length;
      }

      function row(label, value, big = false) {
        if (!value) return;
        ctx.textAlign = "left";
        ctx.font = "500 15px Inter, sans-serif";
        ctx.fillStyle = "#9c6f45";
        ctx.fillText(label, 70, y);

        ctx.textAlign = "right";
        ctx.font = big
          ? "600 26px 'Cormorant Garamond', Georgia, serif"
          : "500 18px Inter, sans-serif";
        ctx.fillStyle = "#3f2f24";
        const lineHeight = big ? 30 : 24;
        const lineCount = wrapRight(value, CARD_WIDTH - 70, y, CARD_WIDTH - 300, lineHeight);
        y += lineCount * lineHeight + (big ? 14 : 10);

        ctx.strokeStyle = "rgba(63,47,36,0.08)";
        ctx.beginPath();
        ctx.moveTo(70, y - 12);
        ctx.lineTo(CARD_WIDTH - 70, y - 12);
        ctx.stroke();
      }

      const priceText = order.sizePrice ? `  ¥${order.sizePrice}` : "";
      row("尺寸 SIZE", `${order.sizeLabel}${priceText}`, true);
      row("口味 FLAVOR", order.flavor);
      row("夹心/水果 FILLING", order.filling);
      row("配送日期 DATE", [order.deliveryDate, order.deliveryTime].filter(Boolean).join("  "));
      row("配送地址 ADDRESS", order.deliveryPlace);
      row("联系电话 PHONE", order.phone);
      if (order.remark) row("备注 NOTE", order.remark);

      y += 14;
      ctx.textAlign = "center";
      ctx.font = "400 13px Inter, sans-serif";
      ctx.fillStyle = "#b98a5e";
      const orderDate = new Date(order.createdAt || Date.now());
      ctx.fillText(
        `订单编号 #${order.id || "—"} · ${orderDate.toLocaleDateString("zh-CN")}`,
        CARD_WIDTH / 2,
        CARD_HEIGHT - 62
      );

      ctx.font = "italic 400 15px Georgia, serif";
      ctx.fillStyle = "#9c6f45";
      ctx.fillText("感谢您的订购，我们将尽快与您联系确认 🎂", CARD_WIDTH / 2, CARD_HEIGHT - 36);

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
    <div className="text-center">
      <canvas ref={canvasRef} className="hidden" />

      {generating && <div className="py-16 text-cocoa-400 text-sm">生成订单卡片中...</div>}

      {!generating && failed && (
        <div className="py-10">
          <p className="text-sm text-cocoa-500 mb-4">卡片生成失败，请重试。</p>
          <button
            onClick={generate}
            className="rounded-lg bg-cocoa-800 text-cream px-4 py-2 text-sm font-medium hover:bg-cocoa-900"
          >
            重新生成
          </button>
        </div>
      )}

      {!generating && !failed && dataUrl && (
        <>
          <img src={dataUrl} alt="订单卡片" className="w-full rounded-xl shadow-soft mb-4" />
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-cocoa-800 text-cream py-2.5 text-sm font-medium hover:bg-cocoa-900 transition-colors"
            >
              💾 保存图片
            </button>
            <button
              onClick={handleShare}
              className="flex-1 rounded-lg border border-cocoa-300 text-cocoa-700 py-2.5 text-sm font-medium hover:bg-cocoa-50 transition-colors"
            >
              📤 分享
            </button>
          </div>
        </>
      )}
    </div>
  );
}
