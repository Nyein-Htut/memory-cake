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
      '[{"label":"4寸","price":120000},{"label":"6寸","price":160000},{"label":"8寸","price":220000},{"label":"10寸","price":260000},{"label":"12寸","price":320000}]',
      '[{"label":"原味","imageUrl":null},{"label":"巧克力","imageUrl":null},{"label":"抹茶","imageUrl":null},{"label":"红丝绒","imageUrl":null},{"label":"芝士","imageUrl":null}]',
      '[{"label":"草莓","imageUrl":null},{"label":"蓝莓酱","imageUrl":null},{"label":"芒果","imageUrl":null},{"label":"什锦水果","imageUrl":null},{"label":"无水果","imageUrl":null}]'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // scripts/setup-db.js
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

  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS wechat_name TEXT;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS seen_by_admin BOOLEAN NOT NULL DEFAULT FALSE;`;
await sql`
    CREATE TABLE IF NOT EXISTS order_messages (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK (sender IN ('admin', 'customer')),
      message TEXT,
      attachment_url TEXT,
      attachment_type TEXT,
      read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
      read_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id, created_at);`;

  await sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      sender TEXT NOT NULL CHECK (sender IN ('admin', 'customer')),
      message TEXT,
      attachment_url TEXT,
      attachment_type TEXT,
      read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
      read_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_messages_phone ON support_messages(phone, created_at);`;
  console.log("Done! All tables ('folders', 'photos', 'order_options', 'orders') are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
