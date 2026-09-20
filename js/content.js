/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — CONTENT LOADER (Supabase → site)
   --------------------------------------------------------------------------
   Reads the content tables and pours them into the very same arrays the static
   site already renders from (DESIGNS, MATERIALS, SERVICES, CATEGORIES).
   Nothing else on the page has to know where the content came from.

   Three sources, in order of preference:
     1. Browser-local draft   → status 'local'   (the administrator edited on
                                this device with the built-in account — the
                                draft wins here until it is published or
                                discarded — see js/store.js)
     2. Supabase              → status 'live'    (the normal, published site)
     3. js/data.js            → status 'offline' / 'disabled'

   Exposes window.SiteContent = { ready, load, loadLocal, status, counts, … }
   ========================================================================== */
(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const sb = window.SiteSupabase;

  const SiteContent = {
    status: 'idle',        // idle | live | empty | local | offline | disabled
    source: 'builtin',     // cloud | local | builtin
    error: null,
    loadedAt: null,
    counts: {},
    ready: null
  };
  window.SiteContent = SiteContent;

  /* ---------------------------------------------------------------- helpers */
  const arr = (v) => (Array.isArray(v) ? v : []);
  const str = (v) => (v === null || v === undefined ? '' : String(v));

  /* row (snake_case, from Postgres) → the object shape js/data.js uses */
  const MAP = {
    categories: (r) => ({
      uuid: r.id,
      id: str(r.slug) || r.id,
      kind: str(r.kind),
      name: str(r.name),
      slug: str(r.slug),
      position: r.position,
      active: r.is_active !== false,
      updatedAt: r.updated_at,
      _row: r
    }),
    designs: (r) => ({
      uuid: r.id,
      id: str(r.code) || r.id,
      code: str(r.code),
      title: str(r.title),
      category: str(r.category),
      featured: r.is_featured === true,
      isFeatured: r.is_featured === true,
      image: str(r.image_url),
      image760: str(r.image_url_760),
      image480: str(r.image_url_480),
      imageAlt: str(r.image_alt),
      badge: str(r.badge),
      time: str(r.lead_time),
      unit: str(r.unit),
      summary: str(r.summary),
      features: arr(r.features),
      materials: arr(r.materials),
      position: r.position,
      active: r.is_active !== false,
      updatedAt: r.updated_at,
      _row: r
    }),
    materials: (r) => ({
      uuid: r.id,
      id: str(r.code) || r.id,
      code: str(r.code),
      name: str(r.name),
      category: str(r.category),
      image: str(r.image_url),
      image760: str(r.image_url_760),
      image480: str(r.image_url_480),
      imageAlt: str(r.image_alt),
      swatch: str(r.swatch) || 'mdf',
      icon: str(r.icon) || 'box',
      unit: str(r.unit),
      badge: str(r.badge),
      note: str(r.note),
      position: r.position,
      active: r.is_active !== false,
      updatedAt: r.updated_at,
      _row: r
    }),
    services: (r) => ({
      uuid: r.id,
      id: str(r.slug) || r.id,
      slug: str(r.slug),
      title: str(r.title),
      category: str(r.category),
      icon: str(r.icon),
      image: str(r.image_url),
      image760: str(r.image_url_760),
      image480: str(r.image_url_480),
      imageAlt: str(r.image_alt),
      text: str(r.card_text),
      eyebrow: str(r.eyebrow),
      blockTitle: str(r.block_title),
      body: str(r.body),
      meta: arr(r.meta),
      bullets: arr(r.bullets),
      ctaLabel: str(r.cta_label),
      linkLabel: str(r.link_label),
      linkHref: str(r.link_href),
      position: r.position,
      active: r.is_active !== false,
      updatedAt: r.updated_at,
      _row: r
    })
  };
  SiteContent.map = MAP;

  /* which global array each table feeds */
  const TARGET = {
    designs: () => (typeof DESIGNS !== 'undefined' ? DESIGNS : null),
    materials: () => (typeof MATERIALS !== 'undefined' ? MATERIALS : null),
    services: () => (typeof SERVICES !== 'undefined' ? SERVICES : null)
  };

  const TABLES = ['designs', 'materials', 'services'];
  const CATEGORY_KINDS = ['design', 'material', 'service'];

  /* a copy of what js/data.js shipped with, so the built-in content can be put
     back after a browser-only draft is discarded */
  const BASELINE = (() => {
    const snap = { categories: {} };
    TABLES.forEach((t) => { snap[t] = ((TARGET[t]() || [])).slice(); });
    const buckets = categoryBuckets();
    if (buckets) CATEGORY_KINDS.forEach((k) => { snap.categories[k] = buckets[k].slice(); });
    return snap;
  })();

  /* the three category lists share one object, so they are replaced in place */
  function categoryBuckets() {
    if (typeof CATEGORIES === 'undefined') return null;
    CATEGORY_KINDS.forEach((k) => { if (!Array.isArray(CATEGORIES[k])) CATEGORIES[k] = []; });
    return CATEGORIES;
  }

  /* replace an array's contents without breaking existing references */
  function replaceInPlace(list, items) {
    if (!list) return;
    list.length = 0;
    for (let i = 0; i < items.length; i++) list.push(items[i]);
  }

  /* rows → the live site arrays */
  function applyRows(tables) {
    let total = 0;
    TABLES.forEach((table) => {
      const items = arr(tables[table]).map(MAP[table]);
      replaceInPlace(TARGET[table](), items);
      SiteContent.counts[table] = items.length;
      total += items.length;
    });

    const buckets = categoryBuckets();
    if (buckets && Array.isArray(tables.categories)) {
      const cats = arr(tables.categories).map(MAP.categories).sort(
        (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0) || a.name.localeCompare(b.name));
      CATEGORY_KINDS.forEach((kind) => {
        replaceInPlace(buckets[kind], cats.filter((c) => c.kind === kind));
      });
      SiteContent.counts.categories = cats.length;
      SiteContent.categoriesMissing = false;
      total += cats.length;
    } else if (buckets) {
      /* the project predates the categories table: the names shipped in
         js/data.js keep the filter bars working until schema.sql is re-run */
      SiteContent.counts.categories = 0;
      SiteContent.categoriesMissing = true;
    }
    return total;
  }
  SiteContent.applyRows = applyRows;
  SiteContent.categoryKinds = CATEGORY_KINDS;

  /* a category is worth a chip when it is visible, or when the visitor is an
     admin (js/main.js decides; this only exposes the list) */
  SiteContent.categoryList = (kind) => {
    const buckets = typeof CATEGORIES !== 'undefined' ? CATEGORIES : null;
    return buckets && Array.isArray(buckets[kind]) ? buckets[kind] : [];
  };

  /* put the shipped content back (used when a browser-only draft is discarded) */
  function restoreBuiltin() {
    TABLES.forEach((t) => replaceInPlace(TARGET[t](), BASELINE[t] || []));
    const buckets = categoryBuckets();
    if (buckets) CATEGORY_KINDS.forEach((k) => replaceInPlace(buckets[k], (BASELINE.categories || {})[k] || []));
    SiteContent.counts = {};
  }
  SiteContent.restore = restoreBuiltin;

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise.then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
    });
  }

  async function fetchTable(table) {
    const { data, error } = await sb.from(table).select('*').order('position', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  function announce(status) {
    if (window.Site) window.Site.refresh();
    document.dispatchEvent(new CustomEvent('site:content', { detail: { status: status || SiteContent.status } }));
    return SiteContent;
  }

  /* turn idb: / leftover data: photo refs into URLs the <img> tags can show,
     without mutating the store rows themselves (those must keep idb: keys) */
  async function hydrateDisplayed() {
    const store = window.SiteStore;
    if (!store || !store.resolveUrl) return;
    const isRef = (s) => !!(s && (store.isMediaRef(s) || /^data:/i.test(s)));
    const bump = async (item) => {
      if (!item) return;
      const r = item._row || {};
      const full = r.image_url || item.image;
      const sm = r.image_url_760 || item.image760;
      const xs = r.image_url_480 || item.image480;
      if (isRef(full) || isRef(sm) || isRef(xs)) {
        item.image = await store.resolveUrl(full);
        item.image760 = sm ? await store.resolveUrl(sm) : '';
        item.image480 = xs ? await store.resolveUrl(xs) : '';
      }
    };
    for (let t = 0; t < TABLES.length; t++) {
      const list = TARGET[TABLES[t]]();
      if (!list) continue;
      for (let i = 0; i < list.length; i++) await bump(list[i]);
    }
  }
  SiteContent.hydrateDisplayed = hydrateDisplayed;

  /* ------------------------------------------------- 1. the browser-only store
     Used while the built-in administrator is signed in on a device whose
     Supabase project has no matching auth user yet. */
  async function loadLocal() {
    const store = window.SiteStore;
    if (!store || !store.active()) return SiteContent;
    if (store.ready) { try { await store.ready; } catch (e) { /* ignore */ } }
    const tables = store.tables();
    applyRows(tables);
    try { await hydrateDisplayed(); } catch (e) { /* photos may lag one refresh */ }
    SiteContent.status = 'local';
    SiteContent.source = 'local';
    SiteContent.error = null;
    SiteContent.loadedAt = new Date();
    return announce('local');
  }
  SiteContent.loadLocal = loadLocal;

  /* ------------------------------------------------------- 2. Supabase tables */
  async function load() {
    /* A draft saved on this device is the newest version of the content the
       administrator has — it must win over the cloud copy on every page and
       after every refresh, otherwise a deleted or edited item comes straight
       back. The draft ends when it is published (cloud account) or discarded
       (sign-out), or is set aside for this tab with "Not now". */
    const st = window.SiteStore;
    if (st && st.ready) { try { await st.ready; } catch (e) { /* ignore */ } }
    if (st && st.active() && !(st.draftPaused && st.draftPaused())) return loadLocal();

    if (cfg.cms && sb) {
      try {
        const results = await withTimeout(
          Promise.all(TABLES.map((t) => fetchTable(t))),
          cfg.contentTimeoutMs || 8000
        );
        const tables = {};
        TABLES.forEach((t, i) => { tables[t] = results[i]; });

        /* the chips live in their own table: an older project may not have it
           yet, and that must not stop the catalogue from loading */
        try {
          tables.categories = await fetchTable('categories');
        } catch (catErr) {
          tables.categories = undefined;
          if (window.console) {
            console.info('[redefine] the categories table is missing — run supabase/schema.sql (§6b)', catErr && catErr.message);
          }
        }

        const total = applyRows(tables);
        SiteContent.status = total ? 'live' : 'empty';
        SiteContent.source = 'cloud';
        SiteContent.error = null;
        SiteContent.loadedAt = new Date();
        return announce('live');
      } catch (err) {
        SiteContent.error = err && err.message ? err.message : String(err);
        if (window.console) console.info('[redefine] Supabase content unavailable —', SiteContent.error);
      }
    } else {
      SiteContent.error = cfg.cms ? 'supabase-js did not load' : 'cms switched off';
    }

    /* Supabase did not answer — fall back to whatever this browser saved */
    if (window.SiteStore && window.SiteStore.active()) return loadLocal();

    /* nothing saved here either: make sure the shipped content is on screen
       (a draft that was just discarded must not linger) */
    restoreBuiltin();

    SiteContent.status = sb && cfg.cms ? 'offline' : 'disabled';
    SiteContent.source = 'builtin';
    SiteContent.loadedAt = new Date();
    return announce();
  }

  SiteContent.load = load;

  /* ---------------------------------------------------------------- realtime
     Somebody edits on their phone → every other open tab follows within a
     second. Ignored while an editor drawer is open (see SiteContent.paused). */
  let rtTimer = null;
  function subscribe() {
    if (!cfg.realtime || !sb || !sb.channel) return;
    try {
      const channel = sb.channel('redefine-content');
      TABLES.concat(['categories']).forEach((table) => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          if (SiteContent.paused || SiteContent.source === 'local') return;
          clearTimeout(rtTimer);
          rtTimer = setTimeout(() => load(), 500);
        });
      });
      channel.subscribe();
      SiteContent.channel = channel;
    } catch (err) {
      if (window.console) console.info('[redefine] realtime unavailable —', err.message);
    }
  }

  SiteContent.ready = load().then(subscribe, subscribe);
})();
