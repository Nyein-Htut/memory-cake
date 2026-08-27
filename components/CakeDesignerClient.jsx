"use client";

import dynamic from "next/dynamic";

const CakeDesigner = dynamic(() => import("./CakeDesigner"), {
  ssr: false,
  loading: () => (
    <div className="py-24 text-center text-cocoa-400 text-sm">
      正在加载设计工具...
    </div>
  ),
});

export default function CakeDesignerClient() {
  return <CakeDesigner />;
}
