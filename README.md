# Memory Cake

A dark-brown & white "elegant" photo album site.

- **Public side** (no login): browse folders, click into a folder, view photos in a lightbox.
- **Admin side** (`/admin`, login required): create folders, upload photos, rename folders, edit captions, delete photos/folders.
- Photos are stored on **Cloudinary** (only the URL + metadata live in your database).
- Folder names and photo URLs are stored in **Neon Postgres**.

---

## 1. Prerequisites

- Node.js 18+ installed
- A free [Neon](https://neon.tech) account (you already have this for two other projects — see note below)
- A free [Cloudinary](https://cloudinary.com) account

---

## 2. Cloudinary setup

**About the free tier (verified July 2026):** Cloudinary's Free plan gives you **25 credits/month**, where 1 credit = 1GB storage **or** 1GB bandwidth **or** 1,000 transformations — all three share the same pool. It's free forever (no time limit, no credit card needed), but if you exceed 25 credits in a month, uploads/delivery can get blocked until the next cycle or you upgrade (paid plans start at $89–99/month).

**Important:** since you're already using Cloudinary for your cake-order website, **create a second, separate Cloudinary account** (different email) just for Memory Cake. Otherwise both sites draw from the same 25-credit pool and you'll run out faster. It's free to have multiple accounts.

Steps:
1. Sign up at https://cloudinary.com (use a different email than your other project, or an email alias like `yourname+memorycake@gmail.com`).
2. On your Cloudinary Dashboard, copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. Put these into your `.env.local` (see step 4 below) as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

That's it — no bucket/folder needs to be pre-created; the app creates a `memory-cake/<folder-id>` path in Cloudinary automatically as you upload.

---

## 3. Neon Postgres setup

You said you already use Neon for two other projects — you can either:
- **Option A (recommended): create a new, separate Neon project** for Memory Cake. Neon's free tier allows multiple projects per account, and keeping data isolated per-project is cleaner and avoids one project's usage affecting another.
- **Option B:** create a new database inside an existing Neon project (Neon lets you have multiple databases per project). Only do this if you're intentionally trying to conserve project slots.

Steps (Option A):
1. Go to https://console.neon.tech and click **New Project**.
2. Name it `memory-cake`, pick a region close to your users, and create it.
3. On the project page, go to **Connection Details** and copy the **pooled connection string** (it looks like `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`). Using the *pooled* connection is important for serverless hosting (Vercel).
4. Put it into `.env.local` as `DATABASE_URL`.
5. Create the tables (see step 5 below — one command does it).

You do **not** need a separate database for anything else — this one Postgres database just holds two small tables: `folders` and `photos` (with the Cloudinary URL in each photo row). It'll stay tiny even with thousands of photos, since no image bytes are stored there.

---

## 4. Environment variables

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from steps 2–3 above.
3. Generate a session secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Paste the output into `SESSION_SECRET`.
4. Choose an admin username, put it in `ADMIN_USERNAME`.
5. Generate a password hash for your admin password:
   ```bash
   node scripts/hash-password.js "yourChosenPassword"
   ```
   Paste the printed `salt:hash` string into `ADMIN_PASSWORD_HASH`. (Your plain password is never stored anywhere — only this hash.)

---

## 5. Install & create database tables

```bash
npm install
npm run db:setup
```

`npm run db:setup` connects to your Neon database using `DATABASE_URL` and creates the `folders` and `photos` tables (safe to re-run — it won't wipe existing data).

---

## 6. Run locally

```bash
npm run dev
```

- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

Log in with the `ADMIN_USERNAME` / password you chose in step 4.

---

## 7. Deploying (e.g. to Vercel)

1. Push this project to a GitHub repo.
2. Import it into [Vercel](https://vercel.com/new).
3. In Vercel's project settings → Environment Variables, add the same variables from your `.env.local` (`DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`).
4. Deploy. Vercel's free tier works fine for this project.

---

## How it works (short version)

- **Uploads:** when the admin selects photos, the browser asks `/api/upload-sign` for a short-lived signed upload token, then uploads the file **directly to Cloudinary** (not through your server — keeps things fast and avoids server upload-size limits). Once Cloudinary confirms the upload, the browser sends the resulting URL to `/api/photos`, which saves it in Postgres.
- **Auth:** a single admin account (from your env vars). Logging in sets an HTTP-only signed cookie (JWT). `middleware.js` blocks any `/admin/*` page if that cookie is missing/invalid. API routes that change data (`POST`/`PATCH`/`DELETE`) also check the cookie server-side.
- **Deleting:** deleting a folder or photo also deletes the underlying image(s) from Cloudinary, so you don't accumulate orphaned files eating your storage credits.

## Project structure

```
app/
  page.js                  Public homepage (folder grid)
  folder/[id]/page.js      Public folder view (photo lightbox)
  admin/login/page.js      Admin login
  admin/dashboard/page.js  Admin: create/rename/delete folders
  admin/folder/[id]/page.js Admin: upload/edit/delete photos in a folder
  api/...                  API routes (auth, folders, photos, upload-sign)
lib/
  db.js           Neon connection
  auth.js         Password hashing + session JWTs
  cloudinary.js   Cloudinary SDK config
  require-auth.js Server-side admin check for API routes
scripts/
  setup-db.js       Creates Postgres tables
  hash-password.js  Generates ADMIN_PASSWORD_HASH
```
