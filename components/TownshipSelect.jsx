"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// Lowercase + strip accents so "Mingalar" / "mingalar" / "Mingalár" all match.
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// 0 = name starts with query, 1 = a word in the name starts with it,
// 2 = appears somewhere inside, null = no match.
function matchScore(text, q) {
  const t = norm(text);
  if (!t) return null;
  if (t.startsWith(q)) return 0;
  if (t.split(/[\s\-_/(),.]+/).some((w) => w.startsWith(q))) return 1;
  if (t.includes(q)) return 2;
  return null;
}

// Bold the part of the name the visitor typed (best effort, plain lowercase match).
function Highlight({ text, query }) {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const i = String(text).toLowerCase().indexOf(q);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-cocoa-200/70 text-cocoa-900 rounded-sm px-0.5">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

// Custom (non-native) township picker with search. The list opens inline
// instead of as a floating popover so it can never be clipped by the order
// modal's scroll area.
export default function TownshipSelect({ townships = [], value, onChange }) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  const selected = townships.find((x) => x.label === value);
  const nameOf = (x) => pickLang(lang, x.label, x.labelEn);
  const feeText = (fee) =>
    Number(fee) > 0 ? `MMK ${Number(fee).toLocaleString("en-US")}` : t("order.free");

  // Search both the Chinese and English names, whatever language the UI is in.
  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return townships;
    return townships
      .map((x) => {
        const scores = [matchScore(x.label, q), matchScore(x.labelEn, q)].filter((s) => s !== null);
        return scores.length ? { x, score: Math.min(...scores) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.x);
  }, [townships, query]);

  // When opened: focus the search box and make sure the panel is on screen
  // (the order modal scrolls, and on phones the keyboard eats half the view).
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      searchRef.current?.focus({ preventScroll: true });
      wrapRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, [open]);

  function closeList() {
    setOpen(false);
    setQuery("");
  }

  function pick(label) {
    onChange(label);
    closeList();
  }

  if (townships.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cocoa-300 bg-white/60 px-4 py-4 text-center text-sm text-cocoa-400">
        {t("order.townshipNone")}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation(); // don't let Esc also close the whole order modal
          closeList();
        }
      }}
    >
      <button
        type="button"
        onClick={() => (open ? closeList() : setOpen(true))}
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
          {/* Search box */}
          <div className="p-2.5 bg-cocoa-50/80 border-b border-cocoa-100">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                inputMode="search"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Enter must NOT submit the order form — pick the top match instead.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (results.length > 0) pick(results[0].label);
                  }
                }}
                placeholder={t("order.townshipSearchPh")}
                className="w-full rounded-lg border border-cocoa-200 bg-white pl-9 pr-9 py-2.5 text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus({ preventScroll: true });
                  }}
                  aria-label={t("common.clear")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-cocoa-100 text-lg leading-none transition-colors"
                >
                  &times;
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 px-0.5 text-[11px] uppercase tracking-wide text-cocoa-500">
              <span>{t("order.townshipTitle")}</span>
              <span>{query ? `${results.length} / ${townships.length}` : townships.length}</span>
            </div>
          </div>

          {/* Results */}
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-cocoa-400">{t("order.townshipNoMatch")}</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-cocoa-100/70">
              {results.map((tp) => {
                const active = tp.label === value;
                const free = !(Number(tp.fee) > 0);
                const name = nameOf(tp);
                // If the match was on the other language's name, show it as a subtitle.
                const other = lang === "en" ? tp.label : tp.labelEn;
                const showOther =
                  query.trim() && other && other !== name && norm(other).includes(norm(query)) && !norm(name).includes(norm(query));
                return (
                  <li key={tp.label}>
                    <button
                      type="button"
                      onClick={() => pick(tp.label)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3.5 text-left transition-colors active:bg-cocoa-100 ${
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
                      <span className="flex-1 min-w-0">
                        <span className={`block truncate text-sm ${active ? "font-medium text-cocoa-900" : "text-cocoa-700"}`}>
                          <Highlight text={name} query={query} />
                        </span>
                        {showOther && (
                          <span className="block truncate text-[11px] text-cocoa-400">
                            <Highlight text={other} query={query} />
                          </span>
                        )}
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
          )}
        </div>
      )}

      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-cocoa-500">
        <InfoIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
        {t("order.townshipNote")}
      </p>
    </div>
  );
}
