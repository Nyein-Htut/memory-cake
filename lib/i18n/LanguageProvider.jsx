"use client";

import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANG, LANG_COOKIE, LANGS, htmlLang, translate } from "./dictionaries";

const LanguageContext = createContext(null);

export function LanguageProvider({ initialLang = DEFAULT_LANG, children }) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback(
    (next) => {
      if (!LANGS.includes(next)) return;
      setLangState(next);
      // Cookie (not localStorage) so server components can read it too.
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = htmlLang(next);
      // Re-render server components (homepage, folder pages) in the new language.
      router.refresh();
    },
    [router]
  );

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  // Safe fallback if a component is ever rendered outside the provider.
  return {
    lang: DEFAULT_LANG,
    setLang: () => {},
    t: (key, vars) => translate(DEFAULT_LANG, key, vars),
  };
}
