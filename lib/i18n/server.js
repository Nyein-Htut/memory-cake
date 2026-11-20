import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, LANGS, translate } from "./dictionaries";

// For server components / layout. Reads the language cookie set by the
// language switcher; falls back to Chinese.
export function getLang() {
  const value = cookies().get(LANG_COOKIE)?.value;
  return LANGS.includes(value) ? value : DEFAULT_LANG;
}

export function getT(lang) {
  return (key, vars) => translate(lang, key, vars);
}
