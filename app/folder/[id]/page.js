import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import PublicHeader from "@/components/PublicHeader";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

async function getFolder(id) {
  const rows = await sql`SELECT * FROM folders WHERE id = ${id}`;
  return rows[0] || null;
}

async function getPhotos(id) {
  return await sql`
    SELECT * FROM photos WHERE folder_id = ${id} ORDER BY created_at ASC
  `;
}

export default async function FolderPage({ params }) {
  const folderId = Number(params.id);
  if (Number.isNaN(folderId)) notFound();

  const folder = await getFolder(folderId);
  if (!folder) notFound();

  const photos = await getPhotos(folderId);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <Link
          href="/"
          className="text-sm text-cocoa-400 hover:text-cocoa-700 transition-colors"
        >
          &larr; All albums
        </Link>

        <div className="mt-4 mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-cocoa-900">
            {folder.name}
          </h1>
          {folder.description && (
            <p className="text-cocoa-500 mt-2 max-w-2xl">{folder.description}</p>
          )}
          <p className="text-cocoa-400 text-xs mt-2 uppercase tracking-wide">
            {photos.length} photo{photos.length === 1 ? "" : "s"}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-24 text-cocoa-400">
            <p className="font-serif text-xl">No photos in this album yet.</p>
          </div>
        ) : (
          <PhotoGallery photos={photos} />
        )}
      </main>

      <footer className="border-t border-cocoa-200/60 py-6 text-center text-xs text-cocoa-400">
        Memory Cake &middot; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
