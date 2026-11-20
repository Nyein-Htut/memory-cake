// Admin-entered text has a Chinese original plus optional English / Burmese.
// zh  -> Chinese
// en  -> English if filled in, else Chinese
// my  -> Burmese if filled in, else English, else Chinese
export function pickLang(lang, zh, en, my) {
  const ok = (s) => typeof s === "string" && s.trim();
  if (lang === "my") {
    if (ok(my)) return my;
    if (ok(en)) return en;
    return zh;
  }
  if (lang === "en" && ok(en)) return en;
  return zh;
}
