/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — CONTENT LOADER (Supabase → site)
   --------------------------------------------------------------------------
   Reads the four content tables and pours them into the very same arrays the
   static site already renders from (HERO_SLIDES, DESIGNS, MATERIALS,
   SERVICES). Nothing else on the page has to know where the content came
   from, and if Supabase is unreachable the built-in js/data.js content simply
   stays on screen.

   Exposes window.SiteContent = { ready, load, status, admin, tables }
   ========================================================================== */
(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const sb = window.SiteSupabase;

  const SiteContent = {
    status: 'idle',        // idle | live | empty | offline | disabled
    error: null,
    loadedAt: null,
    counts: {},
    ready: null
  };
  window.SiteContent = SiteContent;

  if (!cfg.cms || !sb) {
    SiteContent.status = 'disabled';
    SiteContent.ready = Promise.resolve(SiteContent);
    return;
  }

  /* ---------------------------------------------------------------- helpers */
  const arr = (v) => (Array.isArray(v) ? v : []);
  const str = (v) => (v === null || v === undefined ? '' : String(v));

  /* row (snake_case, from Postgres) → the object shape js/data.js uses */
  const MAP = {
    hero_slides: (r) => ({
      uuid: r.id,
      id: str(r.code) || r.id,
      code: str(r.code),
      label: str(r.label),
      image: str(r.image_url),
      sm: str(r.image_url_760),
      xs: str(r.image_url_480),
      alt: str(r.image_alt),
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

  /* which global array each table feeds */
  const TARGET = {
    hero_slides: () => (typeof HERO_SLIDES !== 'undefined' ? HERO_SLIDES : null),
    designs: () => (typeof DESIGNS !== 'undefined' ? DESIGNS : null),
    materials: () => (typeof MATERIALS !== 'undefined' ? MATERIALS : null),
    services: () => (typeof SERVICES !== 'undefined' ? SERVICES : null)
  };

  const TABLES = ['hero_slides', 'designs', 'materials', 'services'];

  /* replace an array's contents without breaking existing references */
  function replaceInPlace(list, items) {
    if (!list) return;
    list.length = 0;
    for (let i = 0; i < items.length; i++) list.push(items[i]);
  }

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

  async function load() {
    try {
      const results = await withTimeout(
        Promise.all(TABLES.map((t) => fetchTable(t))),
        cfg.contentTimeoutMs || 8000
      );

      let total = 0;
      TABLES.forEach((table, i) => {
        const rows = results[i];
        const items = rows.map(MAP[table]);
        replaceInPlace(TARGET[table](), items);
        SiteContent.counts[table] = items.length;
        total += items.length;
      });

      SiteContent.status = total ? 'live' : 'empty';
      SiteContent.error = null;
      SiteContent.loadedAt = new Date();
    } catch (err) {
      SiteContent.status = 'offline';
      SiteContent.error = err && err.message ? err.message : String(err);
      if (window.console) console.info('[redefine] Supabase content unavailable —', SiteContent.error);
    }

    if (window.Site) window.Site.refresh();
    document.dispatchEvent(new CustomEvent('site:content', { detail: { status: SiteContent.status } }));
    return SiteContent;
  }

  SiteContent.load = load;

  /* ---------------------------------------------------------------- realtime
     Somebody edits on their phone → every other open tab follows within a
     second. Ignored while an editor drawer is open (see SiteContent.paused). */
  let rtTimer = null;
  function subscribe() {
    if (!cfg.realtime || !sb.channel) return;
    try {
      const channel = sb.channel('redefine-content');
      TABLES.forEach((table) => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          if (SiteContent.paused) return;
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
