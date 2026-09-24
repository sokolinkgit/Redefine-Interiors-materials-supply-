# Redefine Interiors &amp; Materials Supply — Website

A fast, dependency-free marketing website for **Redefine Interiors & Materials Supply**
(interior design, fittings and building-materials supply, Kenya).

Built with **HTML + CSS + JavaScript only** — no frameworks, no build step, no npm install.
Open `index.html` in a browser and it runs.

---

## 1. Quick start

```bash
# any static server works, e.g.
python3 -m http.server 8080
# then open http://localhost:8080
```

Deploy by copying the whole folder to any host (Netlify, Vercel, cPanel, GitHub Pages,
Cloudflare Pages, an Apache/Nginx box). Nothing needs compiling.

---

## 2. Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — 50/50 hero (copy left, slideshow right), featured designs, featured materials, stats, process, 50-review slideshow (3 per batch, 5s), FAQ, quotation form |
| `designs.html` | Full design portfolio with category filters and an enlarge-photo view (photo, name and a Request-quotation button only) |
| `materials.html` | Material catalogue with product photos, delivery & coverage |
| `about.html` | Compact single-view page — hero with stats plus the four guiding values |
| `contact.html` | Compact single-view page — contact cards and the quotation form |

```
.
├── index.html … contact.html
├── css/style.css          ← single stylesheet (design tokens at the top)
├── css/admin.css          ← the admin overlay only (invisible unless you are signed in)
├── js/data.js             ← built-in content: categories, services, designs, materials, 50 reviews, areas, FAQs
├── js/main.js             ← slideshows, quotation list, filters, modal, forms, animations
├── js/config.js           ← Supabase project URL + anon key + the built-in admin account
├── js/store.js            ← browser-only draft board (built-in admin, before Supabase exists)
├── js/content.js          ← pulls the live content out of Supabase (or the draft board)
├── js/ghost.js            ← five taps on the logo → loads the admin overlay
├── js/admin.js            ← the admin overlay itself (downloaded only when needed)
├── supabase/schema.sql    ← the whole database: tables, RLS, storage bucket, seed
├── supabase/check-sql.mjs ← optional pre-flight check of that file (node supabase/check-sql.mjs)
├── assets/img/            ← photography + logo (REDLOGO.png master, redlogo-512.png web cut) + favicon
│   └── sm/                ← auto-generated 480px & 760px copies used by srcset on phones
├── robots.txt, sitemap.xml
└── README.md
```

---

## 3. WhatsApp quotation system (the core feature)

Every design, material and service block has its own **WhatsApp button**.
Pressing one opens `wa.me` with a message that is already written for that exact item:

> Hello Redefine Interiors & Materials Supply 👋
> I would like to request a quotation for this design:
> **Modern L-Shaped Kitchen Cabinets**
> Category: Kitchen Cabinets
> My location: ______ …

**Quotation list (trolley icon).** Visitors can add several designs/materials to a list
(saved in `localStorage`), adjust quantities, see a live estimated total, then send the whole
list to WhatsApp in one message. The list survives page reloads and works across pages.

**Quotation form** (home + contact) validates input, then composes a structured WhatsApp
message (name, phone, location, service, budget, timeline, details) and opens WhatsApp.

### Phone numbers

One number for everything — it lives in `js/data.js` → `BUSINESS`:

```js
phonePrimary:     '0703 142 874',   // display format
phonePrimaryDial: '+254703142874',  // tel: links
waPrimary:        '254703142874',   // wa.me format (no +, no spaces)
```

Change it once in `data.js` **and** in the static `tel:` links inside the HTML top bar,
hero, quote bands, footer and mobile bar (search for `+254703142874`). A gold **Call**
button sits next to every WhatsApp action (hero, quote bands, footer, floating pair,
mobile action bar) — all dialling the same line.

The sticky header itself carries **no** WhatsApp/Call buttons — it holds only the brand,
the nav links, the quote-list button and the menu toggle. Those two actions live solely in
the floating pair injected by `buildChrome()` in `js/main.js` (`.float-wa` + `.float-call`),
plus the mobile action bar on phones, so the top of the page is never a duplicate set.

---

## 4. Editing content

> **Prefer a dashboard?** Content can also be edited from the website itself — see
> **§9 Supabase CMS & ghost-mode admin**. `js/data.js` then acts as the offline fallback
> and the seed for the database, so both routes stay in step.

Everything lives in **`js/data.js`** — no HTML editing needed:

| Array | What it controls |
| --- | --- |
| `CATEGORIES` | the filter chips of the Designs **and** Materials pages (`design`, `material`) — `service` categories are retained for admin records only |
| `SERVICES` | 6 services kept as admin records only (the public Services page was removed in favour of Designs) |
| `DESIGNS` | Portfolio items: title, category, image, unit, badge, lead time, summary, features, materials, **`featured`** (homepage slideshow) |
| `MATERIALS` | Material catalogue: name, category, `swatch`, unit, badge, note |
| `REVIEWS` | **50 reviews** — name, location, rating, service, date, text |
| `AREAS` | Coverage chips (47+ towns/counties) |
| `FAQS` | Reference copy of the FAQ answers (the visible FAQs are in the HTML for SEO) |

### Adding a design with a photo

```js
{
  id: 'd11',
  title: 'Curved Gypsum TV Feature Wall',
  category: 'Gypsum Works',           // a CATEGORIES.design name — it becomes the filter chip
  image: 'assets/img/d-gypsum-tvwall.jpg',
  featured: true,                     // ← rotates in the homepage slideshow
  unit: '',                           // unit: 'per sqm' | 'per panel' | ''
  badge: 'New', time: '5 – 9 days',
  summary: '…', features: ['…'], materials: ['…']
}
```

### Category chips (the filters)

The chips above the three catalogues are data, not markup: `CATEGORIES.design`,
`CATEGORIES.material` and `CATEGORIES.service` in `js/data.js` for the offline fallback, and
the `categories` table in Supabase once it is connected. Either way they are edited from the
website — **admin bar → Categories** — where you can add, rename, reorder, hide and delete a
chip. Renaming a chip renames it on every design/material/service that used it, and a chip
whose items were deleted keeps a chip so nothing ever becomes unreachable.

### Materials: photo first, swatch as fallback

Every material now carries an `image` pointing at a real product photograph in
`assets/img/` — the home-page preview and the materials catalogue
both render it via `responsiveImg()`:

```js
{
  id: 'm11',
  image: 'assets/img/mat-led-lighting.jpg',   // ← add this and the card switches to photo
  name: 'LED Spotlight & Cove Strip Pack',
  category: 'Lighting',
  swatch: 'led', icon: 'bulb',                // kept as the graceful fallback
  unit: 'per pack', badge: 'Warm / cool', note: '…'
}
```

If `image` is missing or removed, `materialCard()` falls back to the original **designed
CSS swatch tile** (`.swatch--mdf`, `--laminate`, `--hardware`, `--steel`, `--gypsum`,
`--aluminium`, `--tile`, `--fluted`, `--quartz`, `--led`), so nothing ever renders as a
broken image.

### Responsive images (phones first)

Every catalogue photo also exists as `assets/img/sm/<name>-480.jpg` and
`assets/img/sm/<name>-760.jpg`. Markup uses `srcset` + `sizes`, so a phone downloads the
480–760px file (15–60 KB) instead of the 1200–1376px original (110–190 KB). When you add a
new photo, generate the two small copies:

```bash
cd assets/img
base="mat-led-lighting"
convert "$base.jpg" -strip -resize '760x760>' -quality 72 "sm/$base-760.jpg"
convert "$base.jpg" -strip -resize '480x480>' -quality 70 "sm/$base-480.jpg"
```

---

## 5. Slideshows

| Slideshow | Behaviour | Where |
| --- | --- | --- |
| Hero | the **designs ticked as featured** (admin bar → Slideshow, or the ★ on any design card) — **5 second** auto-refresh, progress bar per slide, arrows, dots, swipe, pauses on hover/tab-hidden/off-screen. The pictures are literally the ones on the Designs page, so replacing a design photo replaces it in the slideshow too; if nothing is ticked, the first five designs with a photo are used. Sits in the **right 50%** of the hero with no caption text over it; the left 50% holds the copy over a plain dark CSS gradient (no photo file) | `index.html` (`data-hero`) |
| Reviews | **3 reviews per batch, 5 second** refresh, 17 batches covering all 50 reviews, dots, arrows, progress bar, counter, pause on hover | every page (`data-reviews`) |

Both respect `prefers-reduced-motion`, both pause when scrolled out of view (phones: battery
and data), and the review carousel drops to 1 card per batch and becomes swipeable on
screens ≤ 900px. On phones the hero becomes a **full-screen dashboard**: the slideshow
fills the whole hero behind the copy (static, tack-sharp images — no zoom), with a
legibility scrim, large dots/arrows and a visible slide counter.

---

## 6. Design system

* **Palette** — espresso `#14110E`, cream `#FBF8F3`, brass `#B08540`, sage `#6F7C68`, WhatsApp green `#1FA855`
* **Type** — Playfair Display (display) + Inter (UI), loaded from Google Fonts
* **Tokens** — colours, radii, shadows, spacing and easing are CSS variables at the top of `css/style.css`
* Mobile-first responsive at 1140 / 1024 / 900 / 760 / 520px, with a slide-in mobile nav and a fixed bottom action bar (Call · WhatsApp · Quote list)
* **Phone refinements** (section 20 of the stylesheet — most traffic is mobile):
  16px form fields so iOS never zooms on focus, 44–48px tap targets, `env(safe-area-inset-*)`
  spacing for notched iPhones, filter chips that scroll sideways instead of stacking,
  bottom-sheet modal, sticky-hover effects removed on
  touch devices, and no tap highlight flash
* **Logo** — the gold house-and-check mark of `REDLOGO.png` (master artwork). The site renders
  `redlogo-512.png`, a transparent-background 512px web cut of it, in the header/footer brand slot
  (`.brand__logo`). Regenerate the cut after swapping the master: key out the near-white background
  with PIL and resize to 512px. `logo.svg`/`logo-mark.svg` remain as the old monogram fallbacks;
  `favicon.svg` is unchanged.
* Accessibility — skip link, focus-visible outlines, ARIA labels on carousels/accordions, keyboard support, reduced-motion support
* SEO — per-page titles/descriptions/OG tags, `LocalBusiness` + `AggregateRating` JSON-LD, semantic headings, `sitemap.xml`, `robots.txt`

---

## 7. Photography

**Every design photo comes from Supabase** (the `designs` table + the `site-media` bucket),
uploaded from the admin overlay. No design/hero photo file is referenced from the HTML or
JavaScript any more:

* the homepage slideshow, the Designs Gallery grid, the “Why us” photo on the home page and
  the faint banner photo on the Designs and Contact pages are all rendered from the live
  `designs` rows (`js/data.js` ships an **empty** `DESIGNS` list on purpose);
* the hero backdrop is a CSS gradient;
* only the **Materials** page keeps shipped photo files (`assets/img/mat-*.jpg`, the built-in
  material product shots) — plus the logo/favicon.

**The photo under “Book a site visit”** (home page, “Why Redefine Interiors” section) is one
Designs Gallery photo chosen by the administrator: in admin mode hover/tap it, press the
pencil, pick any gallery design and Save. The choice is stored in `public.site_settings`
(`key = 'why_design'`, `value = {"design": "<uuid>", "code": "<code>"}` — see
`supabase/schema.sql` §6c; run the file once to create the table). Until a choice is made the
design with code `d03` — or the first design with a photo — is used.

## 7b. Quotation requests

* **Home page** — “Request a quotation” in the hero does not leave the page: it expands a
  compact form under the hero (`data-quote-panel`) with **Send my request on WhatsApp** and
  **Request on email** buttons, and folds away once the request has been sent.
* **Contact page** — the same compact form (`form-card--compact`).
* Fields: name, phone, project location, project details (no “service needed” dropdown).
* WhatsApp opens `wa.me/254703142874` with the request written out; e-mail opens the visitor's
  mail app with **To = info@redefineinteriorsandmaterialssupply.co.ke**, a subject and the same
  text in the body (`js/main.js` → `quoteText`, `mailtoLink`).

Suggested next shots (site already supports them — just add entries in `data.js`):
LED lighting pack (wire up `image: 'assets/img/mat-led-lighting.jpg'` on `m10`),
gypsum TV feature wall, aluminium & glass office partition, and a minimart fit-out.

---

## 8. Browser support

Modern evergreen browsers (Chrome, Edge, Safari, Firefox — desktop and mobile).
Progressive enhancement: content (reviews text, contact details) is server-rendered
HTML wherever it matters; carousels, filters and the quotation list hydrate with JavaScript.

---

## 9. Supabase CMS & ghost-mode admin

The homepage slideshow and every photo + line of text on the **Designs**, **Materials** and
**Services** pages can be edited from the website itself — no deploy, no code.

**One file builds the whole database:** [`supabase/schema.sql`](supabase/schema.sql) →
Supabase Studio → SQL Editor → paste → Run. It is idempotent, it repairs an older project
in place (drops the legacy "must have a name" rules, adds new columns), and it seeds
today's content so the site looks pixel-identical afterwards. Edited the file by hand?
`node supabase/check-sql.mjs` checks it first — PostgreSQL parses the whole file before
running any of it, so one stray line stops everything. Full walkthrough:
[`supabase/README.md`](supabase/README.md).

### Signing in — ghost mode

**Tap or click the top-left logo + "Redefine Interiors" five times within one minute.**
No link, no `/admin` page, no visible hint; the counter is silent and survives the one
navigation the logo causes.

**The built-in account always works** — its phone number and a salted SHA-256 hash of its
password are in `js/config.js`. The sign-in panel is **never pre-filled**: the number and the
password are typed every time (and wiped when the panel closes). The password itself is
not in the repository; the owner has it.

| | |
| --- | --- |
| Phone | the business number (also accepts the `+254…` / `254…` forms) |
| Password | held by the owner — change it with the recipe in `js/config.js` |

The site first tries Supabase with those credentials. If an Auth user with that phone number
and password exists, you get the full session and everything you change is published for
everybody straight away. If it does not exist yet, the site signs you in **on that device** —
the bar says *"Only on this device"* and your edits are kept there (`js/store.js`, photos in
IndexedDB). They will not appear on other phones or computers until you publish them.
The sign-in is remembered on the device for 12 hours (`defaultAdmin.sessionHours`), so moving
between pages or reloading never drops admin mode.

**Device edits persist and win.** Whatever was deleted, edited or uploaded on the device is
what that device shows — on every page, after every reload, and for a signed-out visitor on
that device too — until it is published or discarded. Nothing "populates back".

**Publishing device edits.** The first time the *online* admin account signs in on a device
that holds unpublished changes, the site asks *"Publish the changes saved on this device?"*
(the bar also gets **Publish to the website** / **Discard** buttons). Publishing uploads any
photos that were kept on the device to the `site-media` bucket, then makes the cloud tables
match the device exactly — edits applied, additions inserted, deletions deleted — and clears
the device copy. *Not now* sets the draft aside for that tab. A device-only session shows
the same **Publish to the website** button so you can retry the online account after it
has been created.

Other administrators sign in with the **e-mail address *or* phone number** of their Supabase
Auth account plus their password. The first account you create in the project becomes the
owner automatically; promote anyone else with `select public.grant_admin('their@email');`.

> Anyone who reads the code can see the *hash*, not the password; and a device-only sign-in
> can never write to Supabase without the matching Auth user (Row Level Security).

### There is no admin screen — the site *is* the admin screen

Once signed in, the administrator looks at the ordinary website with a small toolbar floating
on every block they may change:

* **✎ edit** the photo and all the text under it, in a drawer styled like the site
* **★ feature** a design in the homepage slideshow (and **take it out** again)
* **⧉ duplicate**, **◀ ▶ reorder**, **◉ hide/show**, **✕ delete**
* a **`+` tile** at the end of each grid creates one new item
* an **Upload many photos** tile (Designs and Materials) opens the gallery with multi-select:
  every photo picked becomes its own item immediately — photo + "Request quotation" only,
  optionally under a chosen category. When you are signed in with the online account they
  go live on every device; names and details are added later with ✎. There is no 30-photo
  cap. A card, the enlarged view and the slideshow all cope with a missing
  name (`.card--nameless`); the WhatsApp message then references the item by its code.

The **admin bar** is pinned to the very top of every page and the page is pushed down by
exactly its height, so it never covers the content. It shows who is signed in and whether
Supabase is connected, and carries three buttons — nothing else:

| Button | What it does |
| --- | --- |
| **Slideshow** | a tick next to every design: tick = its photo rotates on the home page. The slideshow *is* the Designs page — same pictures, same order, so a photo you replace there is replaced here too |
| **Categories** | full CRUD for the filter chips of the Designs **and** Materials pages: add, rename, reorder (↑ ↓), hide from visitors (eye) and delete. Renaming updates every item using that chip |
| **Publish device changes** / **Discard** | shown only to the online account while this device holds unpublished edits (see above) |
| **Sign out** | leaves admin mode; changes saved on the device stay there |

| Editable | Fields |
| --- | --- |
| Designs | photo (also the slideshow photo), alt, **show in the homepage slideshow**, name *(optional)*, summary, "what is included", "materials used", category, badge, typical time, scope note, order, publish |
| Materials | photo (optional — the designed swatch shows without one), alt, name *(optional)*, note, category, unit, badge, swatch, icon, order, publish |
| Services | photo, alt, title, card text, category, icon, slug, eyebrow, block heading, block paragraph, 3 highlight pairs, checklist, WhatsApp button label, second button label + link, order, publish |
| Categories | name, which page it belongs to, order, show in the filters |
| Photos | resized in the browser to **1600 / 760 / 480 px** and uploaded to the public `site-media` bucket so every device sees them. A device-only session keeps the photo in IndexedDB on that phone (not in the tiny localStorage quota) and re-cuts the full set when you tap **Publish to the website** |

### Safety nets

* **Row Level Security** does the real work: everyone may read published rows, only
  `public.admins` may write. The overlay is a convenience — a visitor who downloads
  `js/admin.js` can see the forms but every write is refused by the database.
* **The site never goes blank.** `js/data.js` still holds all the content; the page paints
  from it instantly and is topped up from Supabase when it answers. Offline, the bar says so
  in plain words (no SQL, no project names), and the built-in account keeps working on the
  device copy.
* **Quotation messages carry the photo.** Every *Request quotation* button (design card,
  enlarged view, material card, quotation list) sends the item's name — when it has one — and
  the full web address of its photo, which WhatsApp shows as a picture preview in the chat.
  A photo that only exists on a device (not yet published) has no address and is left out; the
  message then references the item by its code.
* **Schema note.** `supabase/schema.sql` no longer requires a non-empty `title`/`name` on
  designs and materials and drops that check on existing projects, so photo-only items publish.
* **Visitors pay nothing extra.** `js/admin.js` is downloaded only after the gesture (or when
  a session already exists); `css/admin.css` rules are all scoped behind `body.is-admin`.
* **Enlarged photo view.** The enlarge button on a design card opens the photo whole on a dark
  panel with just the design name and a **Request quotation** button — the summary, lead time,
  guarantee/delivery chips, "what is included" and "materials used" are admin-only records.
* **Questions and answers.** The homepage and Designs page carry a **"Some questions and
  answers"** block (`.faq-block[data-collapse]`) that is fully collapsed by default and opens from
  its heading bar; a `#faq` link opens it automatically.
* **Footer.** No logo, social icons or Request-quotation / Call buttons in the footer — the
  floating WhatsApp + Call pair covers that on every page. On phones the footer is two columns
  (Quick links | Get in touch).
* **Edge-scroll navigation.** On every page except Home, a deliberate extra scroll/swipe past the
  very top or very bottom of the page (once the page has rested at that edge for a moment) takes
  the visitor to the home page, `/` (`initEdgeNav()` in `js/main.js`). It ignores wheel momentum, and is
  inert while the menu, quote drawer, enlarged photo or admin overlay is open.
* **One homepage URL.** The logo, the Home link, breadcrumbs, the footer "Client reviews" link and
  the edge-scroll navigation all point at `/` (never `index.html`), matching the canonical
  `https://www.redefineinteriorsandmaterialssupply.co.ke/`. Serve the folder from the root of a
  domain (Vercel, Netlify, cPanel `public_html`, …) — root-relative links do not work from `file://`.
* **Page structure note.** The old `services.html` ("What we do") page was removed in favour
  of the Designs page; its nav link, footer column, homepage section and sitemap entry are gone.
* **Live across devices.** Bulk-uploaded photos go to the `site-media` bucket and the
  designs/materials tables as soon as you are signed in with the online account, so a
  second phone or computer sees the same catalogue after a refresh (or within about a
  second via realtime). Device-only sessions keep photos in IndexedDB on that phone
  until you tap **Publish to the website**.
* **Nothing is lost.** Hiding never deletes; a chip whose items remain keeps working; and the
  seed in `supabase/schema.sql` never overwrites an edit you made.

Switch it off any time with `cms: false` / `admin: false` in `js/config.js`.
