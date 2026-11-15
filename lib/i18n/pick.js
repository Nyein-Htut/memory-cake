// Pick the English text when the visitor is in English AND it was filled in;
// otherwise fall back to the original (Chinese) text.
export function pickLang(lang, zh, en) {
  if (lang === "en" && typeof en === "string" && en.trim()) return en;
  return zh;
}
