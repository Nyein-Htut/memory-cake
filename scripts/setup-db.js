require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // ---- Folders & photos ----
  console.log("Setting up folders + photos tables...");

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
      width INTEGER,
      height INTEGER,
      caption TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);`;

  // ---- Cake ordering ----
  console.log("Setting up order options + orders tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS order_options (
      id INTEGER PRIMARY KEY DEFAULT 1,
      sizes JSONB NOT NULL DEFAULT '[]',
      flavors JSONB NOT NULL DEFAULT '[]',
      fillings JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT single_row CHECK (id = 1)
    );
  `;

  await sql`
    INSERT INTO order_options (id, sizes, flavors, fillings)
    VALUES (
      1,
      '[{"label":"4寸","price":98},{"label":"6寸","price":138},{"label":"8寸","price":188},{"label":"10寸","price":268},{"label":"12寸","price":368}]',
      '["原味","巧克力","抹茶","红丝绒","芝士"]',
      '["草莓","蓝莓酱","芒果","什锦水果","无水果"]'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
      folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
      photo_url TEXT,
      folder_name TEXT,
      size_label TEXT NOT NULL,
      size_price NUMERIC,
      flavor TEXT,
      filling TEXT,
      delivery_date TEXT,
      delivery_time TEXT,
      delivery_place TEXT NOT NULL,
      phone TEXT NOT NULL,
      remark TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`;

  console.log("Done! All tables ('folders', 'photos', 'order_options', 'orders') are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
