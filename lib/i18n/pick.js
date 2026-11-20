// Anyone not in Chinese mode (English or Burmese) gets the English text when
// it was filled in; otherwise the original (Chinese) text.
export function pickLang(lang, zh, en) {
  if (lang !== "zh" && typeof en === "string" && en.trim()) return en;
  return zh;
}
