import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import PublicHeader from "@/components/PublicHeader";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

async function getFolder(id) {
  const rows = await sql`SELECT * FROM folders WHERE id = ${id}`;
  return rows[0] || null;
}

async function getFirstPagePhotos(id) {
  const photos = await sql`
    SELECT * FROM photos WHERE folder_id = ${id}
    ORDER BY created_at ASC
    LIMIT ${PAGE_SIZE}
  `;
  const totalRows = await sql`
    SELECT COUNT(*)::int AS count FROM photos WHERE folder_id = ${id}
  `;
  return { photos, total: totalRows[0].count };
}

export default async function FolderPage({ params }) {
  const folderId = Number(params.id);
  if (Number.isNaN(folderId)) notFound();

  const folder = await getFolder(folderId);
  if (!folder) notFound();

  const { photos, total } = await getFirstPagePhotos(folderId);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <Link
          href="/"
          className="text-sm text-cocoa-400 hover:text-cocoa-700 transition-colors"
        >
          &larr; All albums
        </Link>

        <div className="mt-4 mb-6 sm:mb-10">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-cocoa-900">
            {folder.name}
          </h1>
          {folder.description && (
            <p className="text-cocoa-500 mt-2 max-w-2xl text-sm sm:text-base">{folder.description}</p>
          )}
          <p className="text-cocoa-400 text-xs mt-2 uppercase tracking-wide">
            {total} photo{total === 1 ? "" : "s"}
          </p>
        </div>

        {total === 0 ? (
          <div className="text-center py-16 sm:py-24 text-cocoa-400">
            <p className="font-serif text-lg sm:text-xl">No photos in this album yet.</p>
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

      <footer className="border-t border-cocoa-200/60 py-6 text-center text-xs text-cocoa-400">
        Memory Cake &middot; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
