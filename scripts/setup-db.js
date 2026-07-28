// Run: npm run db:setup
// Reads DATABASE_URL from .env.local and creates the tables Memory Cake needs.
require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      public_id TEXT NOT NULL,
      caption TEXT,
      width INTEGER,
      height INTEGER,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);
  `;

  // Safe to re-run: adds the columns if this DB predates drag-to-reorder.
  console.log("Ensuring position columns exist...");
  await sql`ALTER TABLE folders ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;`;

  // Backfill: give existing rows a stable position based on creation order,
  // but only touch rows that are still at the default (0), so we never
  // clobber an ordering someone has already set by dragging.
  console.log("Backfilling positions for existing rows...");
  await sql`
    UPDATE folders f
    SET position = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
      FROM folders
    ) sub
    WHERE f.id = sub.id AND f.position = 0;
  `;
  await sql`
    UPDATE photos p
    SET position = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY created_at ASC) - 1 AS rn
      FROM photos
    ) sub
    WHERE p.id = sub.id AND p.position = 0;
  `;

  console.log("Done! Tables 'folders' and 'photos' are ready in your Neon database.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
