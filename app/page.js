import Link from "next/link";
import Image from "next/image";
import PublicHeader from "@/components/PublicHeader";
import HeroCarousel from "@/components/HeroCarousel";
import { cldThumb } from "@/lib/cloudinary-url";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export const dynamic = "force-dynamic";

async function getFolders() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/folders`,
    { cache: "no-store" }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.folders;
}

export default async function HomePage() {
  const folders = await getFolders();

  return (
    <div className="min-h-screen flex flex-col bg-[#F0E6DA]">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <HeroCarousel />

        <div id="albums" className="mt-12 sm:mt-16 mb-8 sm:mb-10 text-center">
          <h2 className="font-serif font-semibold text-2xl sm:text-3xl md:text-4xl text-cocoa-900 mb-2">
            🎂 蛋糕作品分类
          </h2>
          <div className="mx-auto w-14 h-px bg-cocoa-400/60 mb-3" />
          <p className="text-cocoa-500 text-sm sm:text-base">
            每一款蛋糕，都是独一无二的回忆
          </p>
        </div>

        {folders.length === 0 ? (
          <div className="text-center py-16 sm:py-24 text-cocoa-400">
            <p className="font-serif text-lg sm:text-xl">No albums yet.</p>
            <p className="text-sm mt-2">
              Check back soon — new memories are on the way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folder/${folder.id}`}
                className="group block rounded-2xl overflow-hidden bg-white border border-cocoa-200 shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-square sm:aspect-[4/3] bg-cocoa-100">
                  {folder.cover_url ? (
                    <Image
                      src={cldThumb(folder.cover_url, 500)}
                      alt={folder.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cocoa-300">
                      <span className="font-serif text-lg">No photos yet</span>
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="font-serif font-medium text-base sm:text-lg text-cocoa-900 truncate">
                    {folder.name}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-cocoa-500 mt-1">
                    <span aria-hidden>🖼️</span>
                    {folder.photo_count} photo{folder.photo_count === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

     <Footer />
    </div>
  );
}
