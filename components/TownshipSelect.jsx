"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pickLang } from "@/lib/i18n/pick";

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
function InfoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

// Custom (non-native) township picker. The list opens inline instead of as a
// floating popover so it can never be clipped by the order modal's scroll area.
export default function TownshipSelect({ townships = [], value, onChange }) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);

  const selected = townships.find((x) => x.label === value);
  const nameOf = (x) => pickLang(lang, x.label, x.labelEn);
  const feeText = (fee) =>
    Number(fee) > 0 ? `MMK ${Number(fee).toLocaleString("en-US")}` : t("order.free");

  if (townships.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cocoa-300 bg-white/60 px-4 py-4 text-center text-sm text-cocoa-400">
        {t("order.townshipNone")}
      </div>
    );
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation(); // don't let Esc also close the whole order modal
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
          open
            ? "border-cocoa-800 ring-2 ring-cocoa-800/15 shadow-card"
            : "border-cocoa-200 hover:border-cocoa-400"
        }`}
      >
        <span
          className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-colors ${
            selected ? "bg-cocoa-800 text-cream" : "bg-cocoa-100 text-cocoa-500"
          }`}
        >
          <PinIcon className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-sm truncate ${selected ? "font-medium text-cocoa-900" : "text-cocoa-400"}`}>
            {selected ? nameOf(selected) : t("order.townshipPh")}
          </span>
          {selected && (
            <span className="block text-[11px] text-cocoa-500">
              {t("order.deliveryFee")} · {feeText(selected.fee)}
            </span>
          )}
        </span>
        <ChevronIcon className={`w-4 h-4 shrink-0 text-cocoa-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-cocoa-200 bg-white shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2 bg-cocoa-50/80 border-b border-cocoa-100 text-[11px] uppercase tracking-wide text-cocoa-500">
            <span>{t("order.townshipTitle")}</span>
            <span>{townships.length}</span>
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-cocoa-100/70">
            {townships.map((tp) => {
              const active = tp.label === value;
              const free = !(Number(tp.fee) > 0);
              return (
                <li key={tp.label}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(tp.label);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                      active ? "bg-cocoa-50" : "hover:bg-cocoa-50/60"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full border shrink-0 ${
                        active ? "bg-cocoa-800 border-cocoa-800 text-cream" : "border-cocoa-200 text-transparent"
                      }`}
                    >
                      <CheckIcon className="w-3 h-3" />
                    </span>
                    <span className={`flex-1 min-w-0 truncate text-sm ${active ? "font-medium text-cocoa-900" : "text-cocoa-700"}`}>
                      {nameOf(tp)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        free ? "bg-green-50 text-green-700" : "bg-cocoa-100 text-cocoa-700"
                      }`}
                    >
                      {feeText(tp.fee)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-cocoa-500">
        <InfoIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
        {t("order.townshipNote")}
      </p>
    </div>
  );
}
