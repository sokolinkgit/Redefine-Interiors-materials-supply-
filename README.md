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
| `index.html` | Home — hero slideshow (5 interiors, 3s), services, featured designs, featured materials, stats, process, 50-review slideshow (3 per batch, 5s), FAQ, quotation form |
| `designs.html` | Full design portfolio with category filters, prices and a "view details" modal |
| `materials.html` | Material catalogue with swatch tiles, full price-list table, delivery & coverage |
| `services.html` | The six services in detail (kitchens, wardrobes, aluminium, gypsum, shop renovation, fittings) |
| `about.html` | Story, values, quality standards, coverage, reviews |
| `contact.html` | Contact cards, quotation form, what-happens-next, coverage, FAQ |

```
.
├── index.html … contact.html
├── css/style.css          ← single stylesheet (design tokens at the top)
├── js/data.js             ← ALL content: services, designs, materials, 50 reviews, areas, FAQs
├── js/main.js             ← slideshows, quotation list, filters, modal, forms, animations
├── assets/img/            ← photography + favicon
├── robots.txt, sitemap.xml
└── README.md
```

---

## 3. WhatsApp quotation system (the core feature)

Every design, material, price-list row and service block has its own **WhatsApp button**.
Pressing one opens `wa.me` with a message that is already written for that exact item:

> Hello Redefine Interiors & Materials Supply 👋
> I would like to request a quotation for this design:
> **Modern L-Shaped Kitchen Cabinets**
> Category: Kitchen Cabinets
> Indicative price: KES 185,000 (from)
> My location: ______ …

**Quotation list (trolley icon).** Visitors can add several designs/materials to a list
(saved in `localStorage`), adjust quantities, see a live estimated total, then send the whole
list to WhatsApp in one message. The list survives page reloads and works across pages.

**Quotation form** (home + contact) validates input, then composes a structured WhatsApp
message (name, phone, location, service, budget, timeline, details) and opens WhatsApp.

### Phone numbers

Both numbers live in `js/data.js` → `BUSINESS`:

```js
phonePrimary:   '0751 261 032',   // primary  (WhatsApp + calls)
phonePrimaryDial: '+254751261032',
waPrimary:      '254751261032',   // wa.me format (no +, no spaces)
phoneSecondary: '+254 703 142874',
waSecondary:    '254703142874',
```

Change them once in `data.js` **and** in the static `tel:` links inside the HTML header,
footer and mobile bar (search for `+254751261032` / `+254703142874`).

---

## 4. Editing content

Everything lives in **`js/data.js`** — no HTML editing needed:

| Array | What it controls |
| --- | --- |
| `SERVICES` | 6 services on the home page and service cards |
| `DESIGNS` | Portfolio items: title, category, image, price, "from" note, unit, badge, lead time, summary, features, materials |
| `MATERIALS` | Material catalogue: name, category, `swatch`, price, unit, badge, note |
| `PRICE_LIST` | Extra rows in the materials price table |
| `REVIEWS` | **50 reviews** — name, location, rating, service, date, text |
| `AREAS` | Coverage chips (47+ towns/counties) |
| `FAQS` | Reference copy of the FAQ answers (the visible FAQs are in the HTML for SEO) |

### Adding a design with a photo

```js
{
  id: 'd11',
  title: 'Curved Gypsum TV Feature Wall',
  category: 'Gypsum Works',           // must match an existing category to group neatly
  image: 'assets/img/d-gypsum-tvwall.jpg',
  price: 62000, priceNote: 'from', unit: '',      // unit: 'per sqm' | 'per panel' | ''
  badge: 'New', time: '5 – 9 days',
  summary: '…', features: ['…'], materials: ['…']
}
```

### Material swatches (no photo required)

Materials are rendered as **designed CSS swatch tiles** rather than stock photos, so the
catalogue stays sharp and licence-free. Available `swatch` values:
`mdf`, `laminate`, `hardware`, `steel`, `gypsum`, `aluminium`, `tile`, `fluted`,
`quartz`, `led` (defined in `css/style.css`). Add a new one by copying a `.swatch--xxx`
block and changing the gradient/texture. If a material later gets a real photograph, add
an `image` field — the card, modal and quotation drawer all prefer `image` automatically.

---

## 5. Slideshows

| Slideshow | Behaviour | Where |
| --- | --- | --- |
| Hero | 5 interiors, **3 second** auto-refresh, progress bar per slide, arrows, dots, swipe, pauses on hover/tab-hidden | `index.html` (`data-hero`) |
| Reviews | **3 reviews per batch, 5 second** refresh, 17 batches covering all 50 reviews, dots, arrows, progress bar, counter, pause on hover | every page (`data-reviews`) |

Both respect `prefers-reduced-motion`, and the review carousel drops to 1 card per batch on
screens ≤ 900px.

---

## 6. Design system

* **Palette** — espresso `#14110E`, cream `#FBF8F3`, brass `#B08540`, sage `#6F7C68`, WhatsApp green `#1FA855`
* **Type** — Playfair Display (display) + Inter (UI), loaded from Google Fonts
* **Tokens** — colours, radii, shadows, spacing and easing are CSS variables at the top of `css/style.css`
* Mobile-first responsive at 1140 / 1024 / 900 / 760 / 520px, with a slide-in mobile nav and a fixed bottom action bar (Call · WhatsApp · Quote list)
* Accessibility — skip link, focus-visible outlines, ARIA labels on carousels/accordions, keyboard support, reduced-motion support
* SEO — per-page titles/descriptions/OG tags, `LocalBusiness` + `AggregateRating` JSON-LD, semantic headings, `sitemap.xml`, `robots.txt`

---

## 7. Photography

All photography is of **interiors and materials only — no people appear in any image**
(no workers, no homeowners, no shoppers), in line with the brief.

Current files (`assets/img/`): 5 hero interiors (kitchen, walk-in closet, gypsum living room,
boutique shop, aluminium sliding doors) + 5 design interiors (3 kitchens, 2 wardrobes).

**To swap in Redefine's own project photos**, simply drop a JPG into `assets/img/` and point
the `image` field in `data.js` at it. Recommended: 1600×900 for hero slides, 1200×900 (4:3)
for cards, under ~250 KB each.

Suggested next shots (site already supports them — just add entries in `data.js`):
gypsum TV feature wall, aluminium & glass office partition, minimart fit-out, quartz
countertop close-up, and a fittings/hardware flat-lay.

---

## 8. Browser support

Modern evergreen browsers (Chrome, Edge, Safari, Firefox — desktop and mobile).
Progressive enhancement: content (prices, reviews text, contact details) is server-rendered
HTML wherever it matters; carousels, filters and the quotation list hydrate with JavaScript.
