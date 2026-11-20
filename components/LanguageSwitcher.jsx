"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";

function GlobeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function starPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.382;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return pts.join(" ");
}

// Flags are inline SVG (not emoji) because Windows doesn't render flag emoji.
function FlagCN({ className }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#DE2910" />
      <polygon points={starPoints(5, 5, 3)} fill="#FFDE00" />
      <polygon points={starPoints(10, 2, 1)} fill="#FFDE00" />
      <polygon points={starPoints(12, 4, 1)} fill="#FFDE00" />
      <polygon points={starPoints(12, 7, 1)} fill="#FFDE00" />
      <polygon points={starPoints(10, 9, 1)} fill="#FFDE00" />
    </svg>
  );
}

function FlagGB({ className }) {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" className={className} aria-hidden="true">
      <clipPath id="gb-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#gb-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

// Myanmar: yellow / green / red stripes with a white star.
function FlagMM({ className }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#FECB00" />
      <rect y="6.67" width="30" height="13.33" fill="#34B233" />
      <rect y="13.33" width="30" height="6.67" fill="#EA2839" />
      <polygon points={starPoints(15, 10.8, 6.6)} fill="#fff" />
    </svg>
  );
}

const OPTIONS = [
  { code: "zh", label: "中文", Flag: FlagCN },
  { code: "en", label: "English", Flag: FlagGB },
  { code: "my", label: "မြန်မာ", Flag: FlagMM },
];

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.language")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center rounded-full border border-cocoa-200 bg-white/70 w-9 h-9 sm:w-10 sm:h-10 text-cocoa-700 hover:text-cocoa-900 hover:border-cocoa-400 hover:bg-white transition-colors"
      >
        <GlobeIcon className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-xl border border-cocoa-200 bg-white shadow-soft py-1 z-50"
        >
          {OPTIONS.map(({ code, label, Flag }) => {
            const active = lang === code;
            return (
              <button
                key={code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                  active ? "bg-cocoa-50 text-cocoa-900 font-medium" : "text-cocoa-700 hover:bg-cocoa-50"
                }`}
              >
                <Flag className="w-6 h-4 rounded-[3px] shadow-sm ring-1 ring-black/10 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <CheckIcon className="w-4 h-4 text-cocoa-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
