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

fun
