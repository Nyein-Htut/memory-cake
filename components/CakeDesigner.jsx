"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 900;

const FROSTING_COLORS = [
  { label: "奶油白", hex: "#fdf8f0" },
  { label: "樱花粉", hex: "#f6c9da" },
  { label: "抹茶绿", hex: "#b7cfa4" },
  { label: "薄荷蓝", hex: "#aed9e0" },
  { label: "香草黄", hex: "#f5e2a8" },
  { label: "薰衣草紫", hex: "#cbb9e0" },
  { label: "巧克力棕", hex: "#6b4a37" },
  { label: "热情红", hex: "#c8493f" },
];

const DRIP_COLORS = [
  { label: "巧克力", hex: "#5c3a24" },
  { label: "焦糖金", hex: "#c8912a" },
  { label: "草莓红", hex: "#d1495b" },
  { label: "纯白", hex: "#fdfdfd" },
];

const RIBBON_COLORS = [
  { label: "薰衣草紫", hex: "#cbb9e0" },
  { label: "金色", hex: "#d4ac86" },
  { label: "樱花粉", hex: "#f6c9da" },
  { label: "深棕", hex: "#6b4d36" },
];

const TOPPER_OPTIONS = [
  { id: "star", label: "⭐ 星星" },
  { id: "heart", label: "❤️ 爱心" },
  { id: "flower", label: "🌸 花朵" },
  { id: "macarons", label: "🍬 马卡龙围边" },
  { id: "fruit", label: "🍓 水果围边" },
  { id: "sprinkles", label: "✨ 彩色糖珠" },
];

const THEMES = [
  {
    id: "birthday",
    label: "🎂 生日派对",
    config: {
      shape: "round", tiers: 1, size: "medium",
      frostingColor: "#f6c9da", frostingStyle: "swirl",
      addDrip: false, dripColor: "#c8912a",
      pipedBorder: true, ribbon: false, ribbonColor: "#cbb9e0",
      toppers: ["sprinkles"], candleCount: 6, message: "Happy Birthday",
    },
  },
  {
    id: "wedding",
    label: "💍 婚礼",
    config: {
      shape: "round", tiers: 2, size: "large",
      frostingColor: "#fdf8f0", frostingStyle: "smooth",
      addDrip: false, dripColor: "#c8912a",
      pipedBorder: true, ribbon: true, ribbonColor: "#cbb9e0",
      toppers: ["flower"], candleCount: 0, message: "",
    },
  },
  {
    id: "kids",
    label: "🧒 儿童派对",
    config: {
      shape: "round", tiers: 1, size: "medium",
      frostingColor: "#aed9e0", frostingStyle: "swirl",
      addDrip: true, dripColor: "#c8912a",
      pipedBorder: false, ribbon: false, ribbonColor: "#cbb9e0",
      toppers: ["star", "sprinkles"], candleCount: 3, message: "",
    },
  },
  {
    id: "floral",
    label: "🌸 花卉主题",
    config: {
      shape: "heart", tiers: 1, size: "medium",
      frostingColor: "#cbb9e0", frostingStyle: "smooth",
      addDrip: false, dripColor: "#c8912a",
      pipedBorder: true, ribbon: false, ribbonColor: "#cbb9e0",
      toppers: ["flower", "fruit"], candleCount: 0, message: "",
    },
  },
];

function shadeColor(hex, percent) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function isLight(hex) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = num >> 16, g = (num >> 8) & 0xff, b = num & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function heartPath(ctx, cx, cy, w, h) {
  const top = h * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, cy + h * 0.35);
  ctx.bezierCurveTo(cx, cy + h * 0.1, cx - w / 2, cy - top * 0.4, cx - w / 2, cy - h * 0.05);
  ctx.bezierCurveTo(cx - w / 2, cy - h * 0.4, cx - w * 0.1, cy - h * 0.45, cx, cy - h * 0.15);
  ctx.bezierCurveTo(cx + w * 0.1, cy - h * 0.45, cx + w / 2, cy - h * 0.4, cx + w / 2, cy - h * 0.05);
  ctx.bezierCurveTo(cx + w / 2, cy - top * 0.4, cx, cy + h * 0.1, cx, cy + h * 0.35);
  ctx.closePath();
}

function starPath(ctx, cx, cy, outerR, innerR, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function clipShape(ctx, cx, capY, w, h, shape) {
  if (shape === "round") {
    ctx.beginPath();
    ctx.ellipse(cx, capY, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === "heart") {
    heartPath(ctx, cx, capY, w, h * 2.2);
  } else {
    roundRect(ctx, cx - w / 2, capY - h / 2, w, h, h * 0.4);
  }
  ctx.clip();
}

function fillShape(ctx, cx, capY, w, h, shape) {
  if (shape === "round") {
    ctx.beginPath();
    ctx.ellipse(cx, capY, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "heart") {
    heartPath(ctx, cx, capY, w, h * 2.2);
    ctx.fill();
  } else {
    roundRect(ctx, cx - w / 2, capY - h / 2, w, h, h * 0.4);
    ctx.fill();
  }
}

function drawCap(ctx, cx, capY, w, h, shape, color) {
  const grad = ctx.createLinearGradient(cx - w / 2, capY - h / 2, cx + w / 2, capY + h / 2);
  grad.addColorStop(0, shadeColor(color, 10));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, shadeColor(color, -6));
  ctx.fillStyle = grad;
  fillShape(ctx, cx, capY, w, h, shape);

  ctx.save();
  clipShape(ctx, cx, capY, w, h, shape);
  const sheen = ctx.createRadialGradient(cx - w * 0.2, capY - h * 0.3, 2, cx - w * 0.2, capY - h * 0.3, w * 0.35);
  sheen.addColorStop(0, "rgba(255,255,255,0.55)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(cx - w, capY - h, w * 2, h * 2);
  ctx.restore();
}

function drawSwirlTexture(ctx, cx, capY, w, h, color) {
  ctx.save();
  ctx.strokeStyle = shadeColor(color, -14);
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.globalAlpha = 0.35;
  const rings = 5;
  for (let i = 0; i < rings; i++) {
    const rw = (w / 2) * (1 - i / rings) * 0.85;
    const rh = (h / 2) * (1 - i / rings) * 0.85;
    if (rw < 4) continue;
    ctx.beginPath();
    ctx.ellipse(cx + (i % 2 === 0 ? 4 : -4), capY, rw, rh, 0, 0.3, Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBody(ctx, x, y, w, h, shape, color) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, shadeColor(color, 6));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, shadeColor(color, -14));
  ctx.fillStyle = grad;
  const radius = shape === "square" ? Math.min(14, w * 0.03) : w * 0.06;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  const shadowGrad = ctx.createLinearGradient(x, y + h - h * 0.18, x, y + h);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(x, y + h - h * 0.18, w, h * 0.18);
  ctx.restore();
}

function drawPipedBorder(ctx, cx, y, w, color) {
  const bumpR = Math.max(7, w * 0.018);
  const count = Math.round(w / (bumpR * 1.6));
  const usableW = w - bumpR * 2;
  ctx.fillStyle = shadeColor(color, 12);
  for (let i = 0; i < count; i++) {
    const bx = cx - w / 2 + bumpR + (count > 1 ? (i * usableW) / (count - 1) : usableW / 2);
    ctx.beginPath();
    ctx.arc(bx, y, bumpR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRibbon(ctx, cx, y, w, bandHeight, color) {
  ctx.fillStyle = color;
  ctx.fillRect(cx - w / 2, y, w, bandHeight);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(cx - w / 2, y + bandHeight * 0.15, w, bandHeight * 0.18);

  const bowY = y + bandHeight / 2;
  ctx.fillStyle = shadeColor(color, -8);
  [-1, 1].forEach((dir) => {
    ctx.beginPath();
    ctx.moveTo(cx, bowY);
    ctx.lineTo(cx + dir * bandHeight * 1.1, bowY - bandHeight * 0.9);
    ctx.lineTo(cx + dir * bandHeight * 0.2, bowY);
    ctx.lineTo(cx + dir * bandHeight * 1.1, bowY + bandHeight * 0.9);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, bowY, bandHeight * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

function drawDrips(ctx, cx, capY, w, h, color) {
  const dripCount = Math.max(8, Math.round(w / 34));
  ctx.fillStyle = color;
  for (let i = 0; i < dripCount; i++) {
    const t = dripCount > 1 ? i / (dripCount - 1) : 0.5;
    const x = cx - w / 2 + t * w;
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const frac = seed - Math.floor(seed);
    const len = h * (0.5 + frac * 0.9);
    const dripW = w * 0.045;
    ctx.beginPath();
    ctx.moveTo(x - dripW / 2, capY + h * 0.1);
    ctx.quadraticCurveTo(x - dripW * 0.6, capY + len * 0.6, x, capY + len);
    ctx.quadraticCurveTo(x + dripW * 0.6, capY + len * 0.6, x + dripW / 2, capY + h * 0.1);
    ctx.closePath();
    ctx.fill();
  }
}

function drawStarTopper(ctx, cx, cy, size) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#f2b705";
  starPath(ctx, cx, cy, size, size * 0.42);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#c98f00";
  ctx.lineWidth = 2;
  starPath(ctx, cx, cy, size, size * 0.42);
  ctx.stroke();
}

function drawHeartTopper(ctx, cx, cy, size) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#d1495b";
  heartPath(ctx, cx, cy, size, size);
  ctx.fill();
  ctx.restore();
}

function drawFlowerTopper(ctx, cx, cy, size) {
  const petalColors = ["#f6c9da", "#f2a8c4"];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    const px = cx + Math.cos(angle) * size * 0.5;
    const py = cy + Math.sin(angle) * size * 0.5;
    ctx.fillStyle = petalColors[i % 2];
    ctx.beginPath();
    ctx.ellipse(px, py, size * 0.42, size * 0.3, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#f2b705";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawMacaronBorder(ctx, cx, capY, w, h) {
  const colors = ["#f6c9da", "#b7cfa4", "#f5e2a8", "#cbb9e0"];
  const count = Math.max(4, Math.round(w / 46));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const x = cx + Math.cos(angle) * (w / 2 - 20);
    const y = capY + Math.sin(angle) * (h / 2 - 8);
    const color = colors[i % colors.length];
    ctx.fillStyle = shadeColor(color, 8);
    ctx.beginPath();
    ctx.ellipse(x, y - 6, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8d1b8";
    ctx.fillRect(x - 13, y - 1, 26, 3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFruitBorder(ctx, cx, capY, w, h) {
  const count = Math.max(4, Math.round(w / 40));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const x = cx + Math.cos(angle) * (w / 2 - 18);
    const y = capY + Math.sin(angle) * (h / 2 - 6);
    ctx.fillStyle = "#c8493f";
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7a2a16";
    ctx.lineWidth = 1;
    for (let s = 0; s < 5; s++) {
      const a = (Math.PI * 2 * s) / 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6);
      ctx.stroke();
    }
    ctx.fillStyle = "#4a7a3c";
    ctx.beginPath();
    ctx.ellipse(x + 6, y - 9, 5, 3, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSprinkles(ctx, cx, capY, w, h) {
  const colors = ["#f6c9da", "#aed9e0", "#f5e2a8", "#cbb9e0", "#c8493f", "#ffffff"];
  const count = 60;
  for (let i = 0; i < count; i++) {
    const seedA = Math.sin(i * 12.9898) * 43758.5453;
    const seedB = Math.sin(i * 78.233) * 12543.123;
    const fracA = seedA - Math.floor(seedA);
    const fracB = seedB - Math.floor(seedB);
    const angle = fracA * Math.PI * 2;
    const dist = fracB * 0.85;
    const x = cx + Math.cos(angle) * (w / 2) * dist;
    const y = capY + Math.sin(angle) * (h / 2) * dist;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(fracA * Math.PI * 2);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-4, -1.3, 8, 2.6);
    ctx.restore();
  }
}

function drawCandles(ctx, cx, capY, w, count) {
  if (count <= 0) return;
  const spacing = Math.min(30, (w * 0.6) / Math.max(1, count - 1 || 1));
  const startX = cx - (spacing * (count - 1)) / 2;
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? cx : startX + i * spacing;
    const candleH = 46;
    const candleW = 8;
    const grad = ctx.createLinearGradient(x - candleW / 2, 0, x + candleW / 2, 0);
    grad.addColorStop(0, "#fff2d0");
    grad.addColorStop(0.5, "#ffe3a1");
    grad.addColorStop(1, "#f5c977");
    ctx.fillStyle = grad;
    roundRect(ctx, x - candleW / 2, capY - candleH, candleW, candleH, 3);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = "rgba(255,150,40,0.8)";
    ctx.shadowBlur = 10;
    const flameGrad = ctx.createRadialGradient(x, capY - candleH - 10, 1, x, capY - candleH - 10, 10);
    flameGrad.addColorStop(0, "#fff6d1");
    flameGrad.addColorStop(0.5, "#ffb703");
    flameGrad.addColorStop(1, "#e85d04");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(x, capY - candleH - 10, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMessage(ctx, cx, y, maxWidth, message, frostingColor) {
  if (!message.trim()) return;
  const textColor = isLight(frostingColor) ? "#6b4536" : "#fffaf0";
  let fontSize = 42;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    ctx.font = `italic 700 ${fontSize}px 'Cormorant Garamond', Georgia, serif`;
    if (ctx.measureText(message).width <= maxWidth || fontSize <= 20) break;
    fontSize -= 2;
  }
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = textColor;
  ctx.fillText(message, cx, y);
  ctx.restore();
}

async function draw(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  await Promise.all([
    document.fonts.load("italic 700 42px 'Cormorant Garamond'").catch(() => {}),
    document.fonts.load("700 40px 'Cormorant Garamond'").catch(() => {}),
    document.fonts.load("600 19px 'Inter'").catch(() => {}),
  ]);

  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#fff9f2");
  bg.addColorStop(1, "#f3e6d6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1a130e";
  ctx.font = "700 40px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("MEMORY CAKE", CANVAS_WIDTH / 2, 78);
  ctx.font = "600 19px Inter, sans-serif";
  ctx.fillStyle = "#7a5738";
  ctx.fillText("记忆蛋糕坊 · DIY 蛋糕设计预览", CANVAS_WIDTH / 2, 108);

  const sizeScale = { small: 0.82, medium: 1, large: 1.16 }[state.size] || 1;
  const baseWidth = 400 * sizeScale;
  const baseHeight = 185 * sizeScale;
  const cx = CANVAS_WIDTH / 2;
  const cakeBottomY = 730;

  ctx.save();
  const plateGrad = ctx.createRadialGradient(cx, cakeBottomY + 18, 10, cx, cakeBottomY + 18, baseWidth * 0.72);
  plateGrad.addColorStop(0, "rgba(0,0,0,0.16)");
  plateGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cakeBottomY + 18, baseWidth * 0.62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const baseCapH = state.shape === "round" ? baseHeight * 0.34 : baseHeight * 0.22;
  const baseBodyY = cakeBottomY - baseHeight;
  const baseCapY = baseBodyY;

  drawBody(ctx, cx - baseWidth / 2, baseBodyY, baseWidth, baseHeight, state.shape, state.frostingColor);

  let topWidth = 0, topHeight = 0, topCapY = 0;
  if (state.tiers === 2) {
    topWidth = baseWidth * 0.6;
    topHeight = baseHeight * 0.82;
    const topBodyY = baseBodyY - topHeight + 14;
    drawBody(ctx, cx - topWidth / 2, topBodyY, topWidth, topHeight, state.shape, state.frostingColor);
    topCapY = topBodyY;
  }

  drawCap(ctx, cx, baseCapY, baseWidth, baseCapH, state.shape, state.frostingColor);
  if (state.frostingStyle === "swirl") drawSwirlTexture(ctx, cx, baseCapY, baseWidth, baseCapH, state.frostingColor);

  let topmostCapY = baseCapY, topmostWidth = baseWidth, topmostCapH = baseCapH;

  if (state.tiers === 2) {
    const topCapH = state.shape === "round" ? topHeight * 0.34 : topHeight * 0.22;
    drawCap(ctx, cx, topCapY, topWidth, topCapH, state.shape, state.frostingColor);
    if (state.frostingStyle === "swirl") drawSwirlTexture(ctx, cx, topCapY, topWidth, topCapH, state.frostingColor);
    topmostCapY = topCapY;
    topmostWidth = topWidth;
    topmostCapH = topCapH;
  }

  if (state.pipedBorder) drawPipedBorder(ctx, cx, cakeBottomY - 2, baseWidth, state.frostingColor);
  if (state.ribbon) drawRibbon(ctx, cx, cakeBottomY - baseHeight * 0.32, baseWidth + 4, 26 * sizeScale, state.ribbonColor);
  if (state.addDrip) drawDrips(ctx, cx, topmostCapY, topmostWidth, baseHeight * 0.5, state.dripColor);

  const topperSize = 34 * sizeScale;
  const hasStar = state.toppers.includes("star");
  const hasHeart = state.toppers.includes("heart");
  if (hasStar) drawStarTopper(ctx, cx - (hasHeart ? 26 : 0), topmostCapY - topperSize * 0.5, topperSize);
  if (hasHeart) drawHeartTopper(ctx, cx + (hasStar ? 26 : 0), topmostCapY - topperSize * 0.4, topperSize);
  if (state.toppers.includes("flower")) drawFlowerTopper(ctx, cx, topmostCapY - topperSize * 0.3, topperSize);
  if (state.toppers.includes("macarons")) drawMacaronBorder(ctx, cx, topmostCapY, topmostWidth, topmostCapH);
  if (state.toppers.includes("fruit")) drawFruitBorder(ctx, cx, topmostCapY, topmostWidth, topmostCapH);
  if (state.toppers.includes("sprinkles")) drawSprinkles(ctx, cx, topmostCapY, topmostWidth, topmostCapH);

  drawCandles(ctx, cx, topmostCapY - topmostCapH * 0.3, topmostWidth, state.candleCount);
  drawMessage(ctx, cx, baseBodyY + baseHeight * 0.55, baseWidth * 0.78, state.message, state.frostingColor);

  ctx.textAlign = "center";
  ctx.font = "500 15px Inter, sans-serif";
  ctx.fillStyle = "#9c8064";
  ctx.fillText("仅供设计预览 · 实际成品可能因手工制作略有差异", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export default function CakeDesigner() {
  const canvasRef = useRef(null);
  const [shape, setShape] = useState("round");
  const [tiers, setTiers] = useState(1);
  const [size, setSize] = useState("medium");
  const [frostingColor, setFrostingColor] = useState(FROSTING_COLORS[1].hex);
  const [frostingStyle, setFrostingStyle] = useState("swirl");
  const [addDrip, setAddDrip] = useState(false);
  const [dripColor, setDripColor] = useState(DRIP_COLORS[0].hex);
  const [pipedBorder, setPipedBorder] = useState(true);
  const [ribbon, setRibbon] = useState(false);
  const [ribbonColor, setRibbonColor] = useState(RIBBON_COLORS[0].hex);
  const [toppers, setToppers] = useState(["sprinkles"]);
  const [candleCount, setCandleCount] = useState(0);
  const [message, setMessage] = useState("");
  const [rendering, setRendering] = useState(true);

  const redraw = useCallback(() => {
    setRendering(true);
    draw(canvasRef.current, {
      shape, tiers, size, frostingColor, frostingStyle, addDrip, dripColor,
      pipedBorder, ribbon, ribbonColor, toppers, candleCount, message,
    }).finally(() => setRendering(false));
  }, [shape, tiers, size, frostingColor, frostingStyle, addDrip, dripColor, pipedBorder, ribbon, ribbonColor, toppers, candleCount, message]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function toggleTopper(id) {
    setToppers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function applyTheme(c) {
    setShape(c.shape);
    setTiers(c.tiers);
    setSize(c.size);
    setFrostingColor(c.frostingColor);
    setFrostingStyle(c.frostingStyle);
    setAddDrip(c.addDrip);
    setDripColor(c.dripColor);
    setPipedBorder(c.pipedBorder);
    setRibbon(c.ribbon);
    setRibbonColor(c.ribbonColor);
    setToppers(c.toppers);
    setCandleCount(c.candleCount);
    setMessage(c.message);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "memory-cake-diy-design.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "memory-cake-diy-design.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "我的DIY蛋糕设计", text: "看看我在Memory Cake设计的蛋糕！" });
        return;
      }
    } catch {
      // fall through
    }
    handleSave();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-8">
      <div className="order-2 lg:order-1">
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl overflow-hidden shadow-soft border border-cocoa-200/60 bg-white">
            <canvas ref={canvasRef} className="w-full h-auto block aspect-[800/900]" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="flex-1 rounded-lg bg-cocoa-800 text-cream py-2.5 text-sm font-medium hover:bg-cocoa-900 transition-colors">
              💾 保存图片
            </button>
            <button onClick={handleShare} className="flex-1 rounded-lg border border-cocoa-300 text-cocoa-800 py-2.5 text-sm font-medium hover:bg-cocoa-50 transition-colors">
              📤 分享设计
            </button>
          </div>
          <p className="text-xs text-cocoa-400 mt-3 text-center">
            这是一个DIY设计预览工具，暂不支持直接下单。若您喜欢这个设计，欢迎截图后通过客服联系我们 🎂
          </p>
        </div>
      </div>

      <div className="order-1 lg:order-2 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">✨ 快速主题</h3>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.config)}
                className="rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-sm text-cocoa-700 hover:border-cocoa-500 hover:bg-cocoa-50 transition-colors text-left"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">形状</h3>
          <div className="flex gap-2">
            {[["round", "圆形"], ["square", "方形"], ["heart", "心形"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setShape(val)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${shape === val ? "border-cocoa-800 bg-cocoa-800 text-cream" : "border-cocoa-200 bg-white text-cocoa-700 hover:border-cocoa-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">层数</h3>
          <div className="flex gap-2">
            {[[1, "单层"], [2, "双层"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTiers(val)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${tiers === val ? "border-cocoa-800 bg-cocoa-800 text-cream" : "border-cocoa-200 bg-white text-cocoa-700 hover:border-cocoa-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">大小</h3>
          <div className="flex gap-2">
            {[["small", "小"], ["medium", "中"], ["large", "大"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSize(val)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${size === val ? "border-cocoa-800 bg-cocoa-800 text-cream" : "border-cocoa-200 bg-white text-cocoa-700 hover:border-cocoa-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">奶油颜色</h3>
          <div className="flex flex-wrap gap-2">
            {FROSTING_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setFrostingColor(c.hex)}
                title={c.label}
                aria-label={c.label}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${frostingColor === c.hex ? "border-cocoa-800 scale-110" : "border-white"} shadow-sm`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">奶油质感</h3>
          <div className="flex gap-2">
            {[["smooth", "顺滑"], ["swirl", "奶油纹理"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFrostingStyle(val)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${frostingStyle === val ? "border-cocoa-800 bg-cocoa-800 text-cream" : "border-cocoa-200 bg-white text-cocoa-700 hover:border-cocoa-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-cocoa-100 rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-cocoa-700">
            <input type="checkbox" checked={addDrip} onChange={(e) => setAddDrip(e.target.checked)} className="accent-cocoa-800" />
            淋面滴落效果
          </label>
          {addDrip && (
            <div className="flex flex-wrap gap-2 pl-6">
              {DRIP_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setDripColor(c.hex)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full border-2 ${dripColor === c.hex ? "border-cocoa-800 scale-110" : "border-white"} shadow-sm`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-cocoa-700">
            <input type="checkbox" checked={pipedBorder} onChange={(e) => setPipedBorder(e.target.checked)} className="accent-cocoa-800" />
            贝壳花边（底部）
          </label>

          <label className="flex items-center gap-2 text-sm text-cocoa-700">
            <input type="checkbox" checked={ribbon} onChange={(e) => setRibbon(e.target.checked)} className="accent-cocoa-800" />
            丝带装饰
          </label>
          {ribbon && (
            <div className="flex flex-wrap gap-2 pl-6">
              {RIBBON_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setRibbonColor(c.hex)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full border-2 ${ribbonColor === c.hex ? "border-cocoa-800 scale-110" : "border-white"} shadow-sm`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">装饰配件</h3>
          <div className="grid grid-cols-2 gap-2">
            {TOPPER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTopper(t.id)}
                className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${toppers.includes(t.id) ? "border-cocoa-800 bg-cocoa-50 text-cocoa-900" : "border-cocoa-200 bg-white text-cocoa-700 hover:border-cocoa-400"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">蜡烛数量：{candleCount}</h3>
          <input
            type="range"
            min={0}
            max={12}
            value={candleCount}
            onChange={(e) => setCandleCount(Number(e.target.value))}
            className="w-full accent-cocoa-800"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cocoa-800 mb-2">蛋糕文字</h3>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 24))}
            placeholder="例如：Happy Birthday"
            className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
          />
          <p className="text-xs text-cocoa-400 mt-1">最多24个字符</p>
        </div>

        {rendering && <p className="text-xs text-cocoa-400">正在生成预览...</p>}
      </div>
    </div>
  );
}
