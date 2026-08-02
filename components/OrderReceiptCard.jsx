"use client";

import { useEffect, useRef, useState } from "react";

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1450; // Increased height to comfortably accommodate larger typography

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
        document.fonts.load("italic 400 24px 'Cormorant Garamond'").catch(() => {}),
      ]);

      const canvas = canvasRef.current;
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext("2d");

      // Bright, Luxurious Light Beige Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
      bgGrad.addColorStop(0, "#fffcf8");
      bgGrad.addColorStop(0.5, "#faf3ea");
      bgGrad.addColorStop(1, "#f7ede2");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Gold Elegant Borders
      ctx.strokeStyle = "#e2c4a6";
      ctx.lineWidth = 3;
      roundRect(ctx, 24, 24, CARD_WIDTH - 48, CARD_HEIGHT - 48, 28);
      ctx.stroke();

      ctx.strokeStyle = "rgba(226, 196, 166, 0.4)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, 40, 40, CARD_WIDTH - 80, CARD_HEIGHT - 80, 22);
      ctx.stroke();

      // Header Section
      ctx.textAlign = "center";
      ctx.fillStyle = "#2c1e16";
      ctx.font = "700 38px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("MEMORY CAKE 记忆蛋糕坊", CARD_WIDTH / 2, 98);

      ctx.font = "italic 500 22px Georgia, serif";
      ctx.fillStyle = "#8c5e34";
      ctx.fillText("— 蛋糕订购确认 Order Confirmation —", CARD_WIDTH / 2, 134);

      ctx.strokeStyle = "#e2c4a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CARD_WIDTH / 2 - 90, 156);
      ctx.lineTo(CARD_WIDTH / 2 + 90, 156);
      ctx.stroke();

      // Photo Frame
      const photoTop = 180;
      const photoSize = CARD_WIDTH - 160; // 740px
      const photoX = (CARD_WIDTH - photoSize) / 2;

      try {
        const img = await loadImage(photoUrl);
        ctx.save();
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 24);
        ctx.clip();

        const scale = Math.max(photoSize / img.width, photoSize / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = photoX + (photoSize - dw) / 2;
        const dy = photoTop + (photoSize - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        // Photo border highlights
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 8;
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 24);
        ctx.stroke();

        ctx.strokeStyle = "rgba(140, 94, 52, 0.2)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 24);
        ctx.stroke();
      } catch {
        ctx.fillStyle = "#f5ebd9";
        roundRect(ctx, photoX, photoTop, photoSize, photoSize, 24);
        ctx.fill();
        ctx.fillStyle = "#8c5e34";
        ctx.font = "500 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎂", CARD_WIDTH / 2, photoTop + photoSize / 2 + 16);
      }

      // Details Table Area
      let y = photoTop + photoSize + 55;

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

      function row(label, value, isHighlight = false) {
        if (!value) return;

        const leftX = 65;
        const rightX = CARD_WIDTH - 65;
        const maxValWidth = CARD_WIDTH - 320;

        // Label Styling (Bigger & Darker)
        ctx.textAlign = "left";
        ctx.font = "600 20px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#7c532d";
        ctx.fillText(label, leftX, y);

        // Value Styling (Bigger & Clearer)
        ctx.textAlign = "right";
        ctx.font = isHighlight
          ? "700 34px 'Cormorant Garamond', Georgia, serif"
          : "600 26px Inter, system-ui, sans-serif";
        ctx.fillStyle = isHighlight ? "#a33b11" : "#2c1e16";

        const lineHeight = isHighlight ? 40 : 34;
        const lineCount = wrapRight(value, rightX, y, maxValWidth, lineHeight);

        y += Math.max(lineCount * lineHeight, 32) + 14;

        // Separator Line
        ctx.strokeStyle = "rgba(124, 83, 45, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, y - 6);
        ctx.lineTo(rightX, y - 6);
        ctx.stroke();

        y += 12; // Gap for next line
      }

      const priceText = order.sizePrice ? `  MMK ${order.sizePrice}` : "";
      row("尺寸 SIZE", `${order.sizeLabel}${priceText}`, true);
      row("口味 FLAVOR", order.flavor);
      row("夹心 FILLING", order.filling);
      row("日期 DATE", [order.deliveryDate, order.deliveryTime].filter(Boolean).join("  "));
      row("地址 ADDRESS", order.deliveryPlace);
      row("电话 PHONE", order.phone);
      if (order.remark) row("备注 NOTE", order.remark);

      // Footer
      const orderDate = new Date(order.createdAt || Date.now());

      ctx.textAlign = "center";
      ctx.font = "500 18px Inter, sans-serif";
      ctx.fillStyle = "#8c5e34";
      ctx.fillText(
        `订单编号 #${order.id || "—"} · ${orderDate.toLocaleDateString("zh-CN")}`,
        CARD_WIDTH / 2,
        CARD_HEIGHT - 85
      );

      ctx.font = "italic 500 20px Georgia, serif";
      ctx.fillStyle = "#634223";
      ctx.fillText("感谢您的订购，我们将尽快与您联系确认 🎂", CARD_WIDTH / 2, CARD_HEIGHT - 50);

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
    <div className="text-center max-w-lg mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {generating && <div className="py-16 text-cocoa-400 text-base font-medium">生成订单卡片中...</div>}

      {!generating && failed && (
        <div className="py-10">
          <p className="text-base text-cocoa-500 mb-4">卡片生成失败，请重试。</p>
          <button
            onClick={generate}
            className="rounded-lg bg-cocoa-800 text-cream px-5 py-2.5 text-base font-medium hover:bg-cocoa-900"
          >
            重新生成
          </button>
        </div>
      )}

      {!generating && !failed && dataUrl && (
        <>
          <img src={dataUrl} alt="订单卡片" className="w-full rounded-xl shadow-lg mb-5" />
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-cocoa-800 text-cream py-3 text-base font-medium hover:bg-cocoa-900 transition-colors shadow-sm"
            >
              💾 保存图片
            </button>
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border-2 border-cocoa-300 text-cocoa-700 py-3 text-base font-medium hover:bg-cocoa-50 transition-colors"
            >
              📤 分享
            </button>
          </div>
        </>
      )}
    </div>
  );
}
