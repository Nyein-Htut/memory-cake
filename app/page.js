import Link from "next/link";
import Image from "next/image";
import { sql } from "@/lib/db";
import PublicHeader from "@/components/PublicHeader";
import { cldThumb } from "@/lib/cloudinary-url";

export const dynamic = "force-dynamic";

async function getFolders() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/folders`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.folders;
}

export default async function HomePage() {
  const folders = await getFolders();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl md:text-5xl text-cocoa-900 mb-2 sm:mb-3">
            Sweet Memories
          </h1>
          <p className="text-cocoa-500 max-w-xl mx-auto text-sm sm:text-base px-2">
            🌸 欢迎欣赏我们的美丽蛋糕作品 🍰
          </p>
        </div>

        {folders.length === 0 ? (
          <div className="text-center py-16 sm:py-24 text-cocoa-400">
            <p className="font-serif text-lg sm:text-xl">No albums yet.</p>
            <p className="text-sm mt-2">Check back soon — new memories are on the way.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folder/${folder.id}`}
                className="group block rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-soft transition-shadow duration-300 border border-cocoa-100"
              >
                <div className="relative aspect-[4/3] bg-cocoa-100">
                  {folder.cover_url ? (
                    <Image
                      src={cldThumb(folder.cover_url, 500)}
                      alt={folder.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cocoa-300">
                      <span className="font-serif text-lg">No photos yet</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="font-serif text-white text-lg sm:text-xl drop-shadow-sm">
                      {folder.name}
                    </h2>
                    <p className="text-cream/80 text-xs mt-1">
                      {folder.photo_count} photo{folder.photo_count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-cocoa-200/60 py-6 text-center text-xs text-cocoa-400">
        Memory Cake &middot; since 2023
      </footer>
    </div>
  );
}
