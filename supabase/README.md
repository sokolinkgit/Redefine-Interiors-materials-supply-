# Supabase CMS + ghost-mode admin — setup

Everything the website needs from Supabase lives in **one file**: [`schema.sql`](./schema.sql).
Run it once and the site is database-driven, with an administrator who can edit every photo
and line of text on the **Designs**, **Materials** and **Services** pages — plus the filter
chips of all three and the homepage slideshow — without ever leaving those pages.

* Project ref: `rzdfmnvkhfuhqybfexuy`
* Project URL: `https://rzdfmnvkhfuhqybfexuy.supabase.co`
* Anon key: already wired into [`js/config.js`](../js/config.js)

The anon key is **public by design** — it ships to every browser. It can only *read*
content that Row Level Security allows, and every write is rejected unless the signed-in
user is listed in `public.admins`. Never put the `service_role` key in the website.

---

## 1. Run the SQL (2 minutes)

1. Open **Supabase Studio** for the project → **SQL Editor** → **New query**.
2. Paste the whole of `supabase/schema.sql`.
3. Press **Run**.

The script is **idempotent** — running it again changes nothing and never overwrites
content you have edited (seeds use `on conflict do nothing`).

It creates:

| Object | Purpose |
| --- | --- |
| `public.admins` | which Supabase Auth users may edit the site |
| `public.designs` | Designs page + the homepage grid, and — via `is_featured` — the homepage slideshow |
| `public.materials` | Materials page + the featured grid on the homepage |
| `public.services` | service cards **and** the six long blocks on `services.html` |
| `public.categories` | the filter chips above the Designs, Materials and Services grids (`kind`, `name`, `position`, `is_active`) |
| `public.hero_slides` | **legacy** — kept so nothing is lost; the homepage slideshow now comes from `designs.is_featured`. Safe to drop |
| `public.is_admin()`, `current_admin()`, `resolve_admin_email()`, `admin_touch_login()` | the security + sign-in helpers the site calls |
| `public.grant_admin()`, `revoke_admin()` | promote / demote an account from the SQL Editor |
| Storage bucket **`site-media`** (public, 8 MB, images only) | every photo uploaded from the admin overlay |
| Row Level Security on all of the above | everyone reads, only admins write |
| Realtime on designs, materials, services and categories | an edit on one device appears on the others |
| Seed data (§10) | today's live content, so nothing changes visually |

---

## 2. Create the administrator account

### The built-in account — works before you do any of this

The website ships with a default administrator coded into
[`js/config.js`](../js/config.js) — the phone number and a salted SHA-256 hash of the
password. The sign-in panel is **never pre-filled**; both values are typed every time.

| | |
| --- | --- |
| Phone | **0703142874** (`+254703142874` / `254703142874` also work) |
| Password | held by the owner (recipe for changing it is in `js/config.js`) |

Tap the logo five times and sign in with those two values **right now** — no Supabase step
needed. Until the Auth user below exists, the admin bar says *“Only on this device”* and your
edits are kept on that device (`js/store.js`, photos in IndexedDB), so you can build the
catalogue first. They stay there — deleted stays deleted, edited stays edited — until you
publish them to the website or discard them. Other phones and computers will not see those
photos until you create the Auth user below and tap **Publish to the website**.

### Then make it the real, published account

1. **Authentication → Users → Add user** → *Create new user*:
   * **Phone**: `+254703142874`
   * **Password**: the built-in password
   * ✔ **Auto Confirm User** → **Create user**
     *(If your project will not accept a user without an e-mail, create it with your own
     e-mail instead and put that address into `SITE_CONFIG.defaultAdmin.email` in
     `js/config.js` — sign-in by phone number still works, the site looks the account up
     with `public.resolve_admin_email()`.)*
2. Promote it in the SQL Editor:
   ```sql
   select public.grant_admin('+254703142874', 'owner', 'Redefine administrator');
   ```
3. Reload the website and sign in again with the same phone number and password. The bar now
   reads **“Connected to Supabase.”** and everything you change is published to everybody —
   including the content you prepared in browser-only mode (add it again, or copy the rows in
   with §11's checks).

### Any other administrator

1. **Authentication → Users → Add user**.
2. Enter an e-mail (or a phone number) and a password, tick **Auto Confirm User**, create.
3. **The first account ever created in the project is promoted to owner automatically** by a
   trigger the script installs on `auth.users`; every later account must be promoted once:
   `select public.grant_admin('their@email');`

Check it in the SQL Editor:

```sql
select email, phone, role, is_active from public.admins;
```

You should see one row with `role = 'owner'` and `is_active = true`.

### Any additional administrator

Create the user the same way, then promote it once:

```sql
select public.grant_admin('second@example.com');          -- by e-mail
select public.grant_admin('+254703142874');               -- or by phone
select public.grant_admin('second@example.com', 'owner', 'Full Name');
```

To remove access (the Auth user stays, the editing rights go):

```sql
select public.revoke_admin('second@example.com');
```

> **Tip:** while you are setting up, turn **off** *Authentication → Providers → Email →
> "Allow new users to sign up"* so nobody else can create an account. The trigger only
> ever auto-promotes the **first** account; every later one is created inactive and needs
> `grant_admin()`.

### Signing in with a phone number

The sign-in form accepts **either**. Two ways a phone login works:

* the Supabase user has that phone number on the account (edit the user → *Phone*) — then
  `signInWithPassword({ phone })` succeeds directly; **or**
* the number is stored on their `public.admins` row — the site calls
  `resolve_admin_email()` and retries with that account's e-mail.

`resolve_admin_email()` returns an e-mail **only** for an active admin whose phone digits
match; for everybody else it returns nothing. (Native phone sign-in — SMS codes — needs an
SMS provider configured under *Authentication → Providers → Phone*; this project does not
require it, because we sign in with a password.)

---

## 3. Sign in on the website (ghost mode)

1. Open any page of the site.
2. **Tap or click the top-left logo + "Redefine Interiors" five times within one minute.**
   There is no link, no `/admin` page and no visible hint — the counter is silent, and it
   survives the one navigation the logo link causes.
3. The sign-in panel appears → enter the **e-mail or phone number** plus the **password**
   (the built-in pair is pre-filled, so one click is enough).
4. A thin **admin bar** appears across the top of every page, and every block you may edit
   grows a toolbar when you hover (or tap) it. The bar holds **Slideshow**, **Categories**
   and **Sign out** — nothing else.

You stay signed in across pages and reloads — the session is stored locally, and the overlay
comes back on its own. Use the bar's **Sign out** (in browser-only mode it also asks whether
to keep or discard the edits that never reached Supabase).

---

## 4. What the admin can do

The admin sees **exactly what a visitor sees** — the same pages, the same hero, the same
cards — with editing controls floating on the real blocks. There is no separate backend
screen anywhere.

| Where | What you can do |
| --- | --- |
| **Homepage slideshow** (admin bar → **Slideshow**) | tick the design photos that rotate on the home page. The slideshow uses the Designs' own pictures in the Designs' own order — replace a design photo and the slideshow follows automatically. Nothing ticked = the first five designs with a photo |
| **Categories** (admin bar → **Categories**, or the *Categories* chip on any filter bar) | add, rename, reorder (↑ ↓), hide from visitors (eye) and delete the chips of the Designs, Materials **and** Services pages. Renaming a chip renames it on every item using it; deleting a chip leaves its items reachable under *All* |
| **Designs** (page + homepage grid) | photo, alt text, title, summary, "what is included", "materials used", category, badge, typical time, scope note, order, publish/unpublish, duplicate, delete |
| **Materials** (page + homepage grid) | photo (optional — without one the designed swatch shows), alt text, name, note, category, unit, badge, swatch, icon, order, publish/unpublish, duplicate, delete |
| **Services** (cards + the six `services.html` blocks) | photo, alt text, title, card text, icon, slug, eyebrow, block heading, block paragraph, up to three highlight pairs, checklist, WhatsApp button label, second button label + link, order, publish/unpublish, duplicate, delete |

Every toolbar:

* ✎ **edit** everything about that block — photo and the text under it
* ★ **feature** a design in the homepage slideshow (a ticked design shows a filled star)
* ⧉ **duplicate** (the copy starts *hidden*, so nothing surprises a visitor)
* ◀ ▶ **move** earlier / later in the order
* ◉ **hide / show** — hidden items stay visible to you, dimmed and dashed, and disappear
  for everyone else
* ✕ **delete** (with a confirmation)

And a **`+` tile** at the end of each grid creates a new item right where it will appear.

### Photos

Drop a file (or click, or paste a URL) into the photo box. The browser resizes it into three
renditions — **1600 / 760 / 480 px** — and uploads all three to the `site-media` bucket, so
phones keep downloading small files exactly like they do with the shipped
`assets/img/sm/` cuts. Limits: 8 MB, JPG/PNG/WebP/AVIF/GIF.

### Seeing the page as a visitor

Sign out, or open the site in a private window — you will see exactly what the public sees
(drafts hidden, no toolbars). Signed in, drafts stay visible to you, dimmed and dashed.

---

## 5. How it fits together

```
supabase/schema.sql        run once — tables, RLS, storage bucket, seed
js/config.js               project URL + anon key + the built-in admin account
js/store.js                browser-only draft board (built-in admin before Auth exists)
js/content.js              reads designs/materials/services/categories into the site's own
                           arrays (the js/data.js shapes) — or from the draft board
js/main.js                 renders those arrays — the hero is the featured designs
js/ghost.js                the five-tap detector; downloads js/admin.js only when needed
js/admin.js                sign-in, admin bar, slideshow picker, categories, editor, uploads
css/admin.css              the overlay's look (invisible unless you are signed in)
```

* **The site never goes blank.** `js/data.js` still ships the full content; the page paints
  from it immediately and is then topped up from Supabase. If Supabase is unreachable the bar
  says so — visitors see the built-in content, and the built-in admin keeps editing the
  browser-only copy.
* **Nothing extra for visitors.** `js/admin.js` and `css/admin.css` are tiny and the admin
  script is only downloaded after the gesture (or when a session already exists).
* **SEO is preserved.** `services.html` keeps its six long blocks in the HTML — JavaScript
  only pours current data into them — so crawlers and no-JS visitors still read them.

---

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Five taps do nothing | Hard-refresh (the JS may be cached). Check the browser console for `supabase-js did not load`. Confirm `js/ghost.js` is on the page. |
| "That account is not an administrator" | `select public.grant_admin('their@email');` in the SQL Editor. |
| Sign-in says *Invalid login credentials* | The account is not confirmed, or the password differs. Authentication → Users → open the user → **Send password recovery** or reset it. |
| Phone sign-in fails but e-mail works | The number is not on the Auth user and not on their `admins` row. Edit the user in Authentication → Users and add the phone, or `update public.admins set phone='+2547…' where email='…';` |
| Saving says *row-level security* | Your session expired or you were demoted. Sign out, sign in again; check `select * from public.admins;`. |
| Photo upload fails | The `site-media` bucket is missing (re-run §8 of the SQL) or the file is over 8 MB / not an image. |
| Bulk upload stops around ~30 photos / “out of storage” | Old versions stuffed photos into localStorage (~5–10 MB). Photos now live in IndexedDB and, when you are signed in with the online account, go straight to the `site-media` bucket — there is no 30-photo cap. Reload once so the new script runs; leftover data-URL photos are moved automatically. |
| The site shows the old content | Reload the page (the live content is fetched at load), or check `select count(*) from public.designs;`. |
| Edits do not appear for visitors on **other** devices | Photos only land on every device when they are **published to Supabase**. If the bar says *“Only on this device”*, tap **Publish to the website** (the online account must exist — §2). Hidden items (`is_active = false`) also stay off other devices until you toggle the eye. |
| The bar says *“Only on this device”* / *“Saved on this device”* | You signed in with the built-in account and Supabase has no user with that phone number yet — create it (§2) and sign in again (or tap **Publish to the website**). The site uploads the photos and makes the cloud match the device. |
| Publishing a photo-only item fails with a `check` error | Re-run `schema.sql` (idempotent) — it drops the old non-empty `title`/`name` constraints on `designs`/`materials`. |
| A category says *run §12 of supabase/schema.sql* | The project predates the `categories` table / `is_featured` column. Paste the whole `schema.sql` again — it is idempotent and adds them in place. |
| The slideshow ignores my tick | Only designs that have a **photo** rotate, and hidden designs are skipped. Tick at least one from admin bar → Slideshow. |

---

## 7. Turning it off

* **Temporarily:** set `cms: false` (and/or `admin: false`) in `js/config.js`. The site then
  runs purely from `js/data.js` again — no database calls at all.
* **Completely:** remove the seven `<script>`/`<link>` lines added to each page
  (`config.js`, `store.js`, `content.js`, `ghost.js`, `css/admin.css` and the supabase-js
  CDN tags).
  The site is unchanged from before, because `js/data.js` still holds all the content.
