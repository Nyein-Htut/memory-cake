"use client";

import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";

function DesignerLoading() {
  const { t } = useLang();
  return <div className="py-24 text-center text-cocoa-400 text-sm">{t("design.loading")}</div>;
}

const CakeDesigner = dynamic(() => import("./CakeDesigner"), {
  ssr: false,
  loading: () => <DesignerLoading />,
});

export default function CakeDesignerClient() {
  return <CakeDesigner />;
}
