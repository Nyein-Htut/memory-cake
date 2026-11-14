import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CakeDesignerClient from "@/components/CakeDesignerClient";
import { getLang, getT } from "@/lib/i18n/server";

export function generateMetadata() {
  const t = getT(getLang());
  return {
    title: t("design.metaTitle"),
    description: t("design.metaDesc"),
  };
}

export default function DesignPage() {
  const t = getT(getLang());

  return (
    <div className="min-h-screen flex flex-col bg-[#F0E6DA]">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-cocoa-900 mb-2">
            {t("design.title")}
          </h1>
          <p className="text-cocoa-500 text-sm sm:text-base max-w-xl mx-auto">
            {t("design.sub")}
          </p>
        </div>

        <CakeDesignerClient />
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}
