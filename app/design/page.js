import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CakeDesigner from "@/components/CakeDesigner";

export const metadata = {
  title: "DIY 蛋糕设计 | Memory Cake",
  description: "自由搭配形状、颜色与装饰，实时预览你的专属蛋糕设计。",
};

export default function DesignPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F0E6DA]">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-cocoa-900 mb-2">
            🎂 DIY 蛋糕设计
          </h1>
          <p className="text-cocoa-500 text-sm sm:text-base max-w-xl mx-auto">
            挑选形状、颜色与装饰，实时预览属于你的专属蛋糕设计
          </p>
        </div>

        <CakeDesigner />
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}
