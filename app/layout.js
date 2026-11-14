import "./globals.css";
import PushPrompt from "@/components/PushPrompt";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getLang, getT } from "@/lib/i18n/server";

export function generateMetadata() {
  const t = getT(getLang());
  return {
    title: "Memory Cake",
    description: t("meta.description"),
    manifest: "/manifest.json",
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },
    appleWebApp: {
      capable: true,
      title: "Memory Cake",
      statusBarStyle: "default",
    },
  };
}

export const viewport = {
  themeColor: "#3f2f24",
};

export default function RootLayout({ children }) {
  const lang = getLang();

  return (
    <html lang={lang === "en" ? "en" : "zh-CN"}>
      <body className="min-h-screen bg-cream text-cocoa-900 antialiased">
        <LanguageProvider initialLang={lang}>
          {children}
          <PushPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
