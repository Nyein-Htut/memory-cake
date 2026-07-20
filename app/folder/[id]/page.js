import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import PublicHeader from "@/components/PublicHeader";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

async function getFolder(id) {
  const rows = await sql`
    SELECT * FROM folders
    WHERE id = ${id}
  `;
  return rows[0] || null;
}

async function getFirstPagePhotos(id) {
  const photos = await sql`
    SELECT *
    FROM photos
    WHERE folder_id = ${id}
    ORDER BY created_at ASC
    LIMIT ${PAGE_SIZE}
  `;

  const totalRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM photos
    WHERE folder_id = ${id}
  `;

  return {
    photos,
    total: totalRows[0].count,
  };
}

export default async function FolderPage({ params }) {
  const folderId = Number(params.id);

  if (Number.isNaN(folderId)) notFound();

  const folder = await getFolder(folderId);

  if (!folder) notFound();

  const { photos, total } = await getFirstPagePhotos(folderId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F0E6DA]">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-12">
        <Link
          href="/"
          className="text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
        >
          &larr; All albums
        </Link>

        <div className="mt-5 mb-8 sm:mb-10">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl md:text-5xl text-cocoa-900">
            {folder.name}
          </h1>

          {folder.description && (
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-cocoa-600">
              {folder.description}
            </p>
          )}

          <p className="mt-3 text-xs uppercase tracking-wider text-cocoa-500">
            {total} photo{total === 1 ? "" : "s"}
          </p>
        </div>

        {total === 0 ? (
          <div className="py-20 text-center text-cocoa-500">
            <p className="font-serif text-xl">
              No photos in this album yet.
            </p>
          </div>
        ) : (
          <PhotoGallery
            folderId={folderId}
            initialPhotos={photos}
            total={total}
            pageSize={PAGE_SIZE}
          />
        )}
      </main>

      <footer className="border-t border-cocoa-300/60 bg-[#F0E6DA] py-6 text-center text-xs text-cocoa-500">
        Memory Cake &middot; since 2023
      </footer>
    </div>
  );
}
