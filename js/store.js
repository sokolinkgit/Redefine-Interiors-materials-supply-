/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — BROWSER-LOCAL CONTENT STORE
   --------------------------------------------------------------------------
   The built-in administrator account (js/config.js → defaultAdmin) must be
   able to open the admin bar even before the Supabase project has a matching
   auth user, and even when the database cannot be reached at all.

   When the cloud session is not available, every change the administrator
   makes is written here instead — a single localStorage record holding the
   same rows the Postgres tables hold (snake_case, `id` keys), so the exact
   same editor, the same reading code and the same rendering run either way:

       cloud mode   js/admin.js → supabase.from(table)…
       local mode   js/admin.js → SiteStore.insert/update/remove(table, …)

   Photos are NEVER kept in localStorage (a handful of JPEGs as data: URLs
   fills the ~5–10 MB quota and the browser then reports "out of storage").
   Image bytes live in IndexedDB under `idb:<id>` references; localStorage
   only holds the catalogue metadata, which stays tiny even with hundreds of
   photos. Those photos still exist only on this device until they are
   published to the site-media bucket.
   ========================================================================== */
(function () {
  'use strict';

  const KEY = 'redefine_local_content_v1';
  const TABLES = ['designs', 'materials', 'services', 'categories'];
  const CATEGORY_KINDS = ['design', 'material', 'service'];
  const IMAGE_KEYS = ['image_url', 'image_url_760', 'image_url_480'];
  const IDB_NAME = 'redefine_media_v1';
  const IDB_STORE = 'photos';

  const alive = (() => {
    try {
      localStorage.setItem('__redefine_probe', '1');
      localStorage.removeItem('__redefine_probe');
      return true;
    } catch (e) { return false; }
  })();

  let data = null;

  /* ------------------------------------------------------------- utilities */
  function nowIso() { return new Date().toISOString(); }

  function uid(prefix) {
    const rnd = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : ('id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
    return prefix ? prefix + '-' + rnd : rnd;
  }

  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[’'"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function blank() { return { v: 1, savedAt: null, active: false, tables: { designs: [], materials: [], services: [], categories: [] } }; }

  function read() {
    if (!alive) return null;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw || typeof raw !== 'object') return null;
      const out = blank();
      out.active = raw.active === true;
      out.savedAt = raw.savedAt || null;
      TABLES.forEach((t) => { out.tables[t] = Array.isArray(raw.tables && raw.tables[t]) ? raw.tables[t] : []; });
      return out;
    } catch (e) { return null; }
  }

  /* returns false when the browser refused (storage quota / private mode) so
     the caller can roll back instead of pretending the change was kept */
  let lastError = null;
  function save() {
    if (!alive || !data) return false;
    data.savedAt = nowIso();
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      lastError = null;
      return true;
    } catch (e) {
      lastError = e;
      return false;
    }
  }
  const quotaHit = (e) => !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);

  function ensure() { if (!data) data = read() || blank(); return data; }

  /* --------------------------------------------------- IndexedDB photo vault
     localStorage cannot hold a catalogue of photos. IndexedDB typically has
     hundreds of megabytes, which is enough for bulk uploads on one device. */
  let db = null;
  let mediaPersistent = false;
  const memPhotos = new Map();
  const urlCache = Object.create(null);

  const isMediaRef = (s) => /^idb:/i.test(String(s || ''));
  const mediaId = (s) => String(s || '').replace(/^idb:/i, '');

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('no-idb')); return; }
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const next = req.result;
        if (!next.objectStoreNames.contains(IDB_STORE)) next.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('idb-open-failed'));
    });
  }

  function idbPut(id, blob) {
    if (!db) { memPhotos.set(id, blob); return Promise.resolve(); }
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(IDB_STORE).put(blob, id);
      } catch (e) { reject(e); }
    });
  }

  function idbGet(id) {
    if (memPhotos.has(id)) return Promise.resolve(memPhotos.get(id));
    if (!db) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  function idbDel(id) {
    memPhotos.delete(id);
    if (urlCache[id]) { try { URL.revokeObjectURL(urlCache[id]); } catch (e) { /* ignore */ } delete urlCache[id]; }
    if (!db) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.objectStore(IDB_STORE).delete(id);
      } catch (e) { resolve(); }
    });
  }

  function idbClear() {
    memPhotos.clear();
    Object.keys(urlCache).forEach((k) => { try { URL.revokeObjectURL(urlCache[k]); } catch (e) { /* ignore */ } delete urlCache[k]; });
    if (!db) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.objectStore(IDB_STORE).clear();
      } catch (e) { resolve(); }
    });
  }

  async function putPhoto(blob) {
    if (!blob) throw new Error('No photo to save.');
    const id = uid('pic');
    try {
      await idbPut(id, blob);
    } catch (e) {
      memPhotos.set(id, blob);
    }
    return 'idb:' + id;
  }

  async function getPhotoBlob(ref) {
    const s = String(ref || '');
    if (!s) return null;
    if (isMediaRef(s)) {
      try { return await idbGet(mediaId(s)); } catch (e) { return memPhotos.get(mediaId(s)) || null; }
    }
    if (/^data:|^blob:/i.test(s)) {
      try {
        const res = await fetch(s);
        return await res.blob();
      } catch (e) { return null; }
    }
    return null;
  }

  async function resolveUrl(ref) {
    const s = String(ref || '');
    if (!s) return '';
    if (!isMediaRef(s) && !/^data:/i.test(s)) return s;
    if (isMediaRef(s)) {
      const id = mediaId(s);
      if (urlCache[id]) return urlCache[id];
      const blob = await getPhotoBlob(s);
      if (!blob) return '';
      const url = URL.createObjectURL(blob);
      urlCache[id] = url;
      return url;
    }
    return s;
  }

  async function dataUrlToBlob(url) {
    const res = await fetch(url);
    return res.blob();
  }

  async function persistRowImages(row) {
    if (!row) return row;
    for (let i = 0; i < IMAGE_KEYS.length; i++) {
      const key = IMAGE_KEYS[i];
      const v = row[key];
      if (typeof v !== 'string' || !/^data:/i.test(v)) continue;
      try {
        const blob = await dataUrlToBlob(v);
        row[key] = await putPhoto(blob);
      } catch (e) {
        /* keep the data URL rather than dropping the photo; save() may still
           refuse it, and the caller then rolls back */
      }
    }
    return row;
  }

  function collectMediaRefs(tables) {
    const ids = [];
    TABLES.forEach((t) => {
      (tables[t] || []).forEach((row) => {
        IMAGE_KEYS.forEach((k) => {
          if (isMediaRef(row[k])) ids.push(mediaId(row[k]));
        });
      });
    });
    return ids;
  }

  async function migrateInlinePhotos() {
    const d = ensure();
    let changed = false;
    for (let t = 0; t < TABLES.length; t++) {
      const list = d.tables[TABLES[t]] || [];
      for (let i = 0; i < list.length; i++) {
        const before = IMAGE_KEYS.map((k) => list[i][k]);
        await persistRowImages(list[i]);
        if (IMAGE_KEYS.some((k, n) => list[i][k] !== before[n])) changed = true;
      }
    }
    if (changed) save();
  }

  const ready = (async () => {
    try {
      db = await openDb();
      mediaPersistent = true;
    } catch (e) {
      db = null;
      mediaPersistent = false;
    }
    try { await migrateInlinePhotos(); } catch (e) { /* still usable */ }
    return true;
  })();

  /* --------------------------------------------------- built-in → same shape
     js/data.js keeps the fallback content in camelCase; the store speaks the
     Postgres row shape so one single mapper (js/content.js) can read both.   */
  const ITEM_ROWS = {
    designs: (d, i) => ({
      id: d.uuid || d.id || uid('design'),
      code: d.code || d.id || '',
      title: d.title || '',
      category: d.category || '',
      image_url: d.image || '',
      image_url_760: d.image760 || '',
      image_url_480: d.image480 || '',
      image_alt: d.imageAlt || '',
      badge: d.badge || '',
      lead_time: d.time || '',
      unit: d.unit || '',
      summary: d.summary || '',
      features: d.features || [],
      materials: d.materials || [],
      is_featured: d.featured === true || d.isFeatured === true,
      position: Number(d.position) || (i + 1) * 10,
      is_active: d.active !== false
    }),
    materials: (m, i) => ({
      id: m.uuid || m.id || uid('material'),
      code: m.code || m.id || '',
      name: m.name || '',
      category: m.category || '',
      image_url: m.image || '',
      image_url_760: m.image760 || '',
      image_url_480: m.image480 || '',
      image_alt: m.imageAlt || '',
      swatch: m.swatch || 'mdf',
      icon: m.icon || 'box',
      unit: m.unit || '',
      badge: m.badge || '',
      note: m.note || '',
      position: Number(m.position) || (i + 1) * 10,
      is_active: m.active !== false
    }),
    services: (s, i) => ({
      id: s.uuid || s.id || uid('service'),
      slug: s.slug || slugify(s.title),
      title: s.title || '',
      category: s.category || '',
      icon: s.icon || 'spark',
      image_url: s.image || '',
      image_url_760: s.image760 || '',
      image_url_480: s.image480 || '',
      image_alt: s.imageAlt || '',
      card_text: s.text || '',
      eyebrow: s.eyebrow || '',
      block_title: s.blockTitle || '',
      body: s.body || '',
      meta: s.meta || [],
      bullets: s.bullets || [],
      cta_label: s.ctaLabel || '',
      link_label: s.linkLabel || '',
      link_href: s.linkHref || '',
      position: Number(s.position) || (i + 1) * 10,
      is_active: s.active !== false
    })
  };

  function itemRows(table, list) {
    const build = ITEM_ROWS[table];
    if (build) return (list || []).map(build);
    return (list || []).slice();
  }

  /* the three built-in category lists → category rows */
  function categoryRows() {
    if (typeof CATEGORIES === 'undefined') return [];
    const out = [];
    CATEGORY_KINDS.forEach((kind) => {
      (CATEGORIES[kind] || []).forEach((c, i) => {
        out.push({
          id: c.uuid || uid('cat'),
          kind: kind,
          name: c.name || '',
          slug: c.slug || slugify(c.name),
          position: Number(c.position) || (i + 1) * 10,
          is_active: c.active !== false && c.hidden !== true
        });
      });
    });
    return out;
  }

  /* ----------------------------------------------- snapshot the live content
     Called once, when the built-in administrator signs in for the first time:
     whatever the visitor is looking at right now (Supabase or js/data.js)
     becomes the starting point of the browser-only draft.                    */
  function begin() {
    const d = ensure();
    if (d.active && d.tables.designs.length + d.tables.materials.length + d.tables.services.length + d.tables.categories.length) {
      d.active = true;
      save();
      return d;
    }

    /* `const DESIGNS` lives in the global script scope, not on window */
    const pick = (value) => (Array.isArray(value) ? value : []);

    d.tables.designs = itemRows('designs', pick(typeof DESIGNS !== 'undefined' ? DESIGNS : []));
    d.tables.materials = itemRows('materials', pick(typeof MATERIALS !== 'undefined' ? MATERIALS : []));
    d.tables.services = itemRows('services', pick(typeof SERVICES !== 'undefined' ? SERVICES : []));
    d.tables.categories = categoryRows();
    d.active = true;
    save();
    return d;
  }

  function clear() {
    data = blank();
    if (alive) { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
    idbClear();
  }

  /* ------------------------------------------------------------------- CRUD */
  function table(name) {
    const d = ensure();
    if (!d.tables[name]) d.tables[name] = [];
    return d.tables[name];
  }

  async function insert(name, row) {
    const list = table(name);
    const copy = Object.assign({}, row);
    if (!copy.id) copy.id = uid(name.slice(0, 4));
    copy.created_at = copy.created_at || nowIso();
    copy.updated_at = nowIso();
    await persistRowImages(copy);
    list.push(copy);
    if (!save()) { list.pop(); return null; }
    return copy;
  }

  async function insertMany(name, rows) {
    const list = table(name);
    const copies = [];
    for (let i = 0; i < (rows || []).length; i++) {
      const copy = Object.assign({}, rows[i]);
      if (!copy.id) copy.id = uid(name.slice(0, 4));
      copy.created_at = copy.created_at || nowIso();
      copy.updated_at = nowIso();
      await persistRowImages(copy);
      copies.push(copy);
      list.push(copy);
    }
    if (!save()) {
      for (let i = 0; i < copies.length; i++) list.pop();
      return null;
    }
    return copies;
  }

  async function update(name, id, patch) {
    const list = table(name);
    const row = list.filter((r) => String(r.id) === String(id))[0];
    if (!row) return null;
    const before = Object.assign({}, row);
    Object.assign(row, patch, { updated_at: nowIso() });
    await persistRowImages(row);
    if (!save()) {
      Object.keys(row).forEach((k) => { delete row[k]; });
      Object.assign(row, before);
      return null;
    }
    IMAGE_KEYS.forEach((k) => {
      if (isMediaRef(before[k]) && before[k] !== row[k]) idbDel(mediaId(before[k]));
    });
    return row;
  }

  function updateWhere(name, match, patch) {
    const list = table(name);
    let touched = 0;
    list.forEach((row) => {
      const hit = Object.keys(match).every((k) => row[k] === match[k]);
      if (!hit) return;
      Object.assign(row, patch, { updated_at: nowIso() });
      touched += 1;
    });
    if (touched) save();
    return touched;
  }

  function remove(name, id) {
    const list = table(name);
    const i = list.findIndex((r) => String(r.id) === String(id));
    if (i < 0) return false;
    const row = list[i];
    IMAGE_KEYS.forEach((k) => { if (isMediaRef(row[k])) idbDel(mediaId(row[k])); });
    list.splice(i, 1);
    save();
    return true;
  }

  /* keep a table in the order the administrator sees, exactly like the
     position-based ordering the cloud tables use */
  function reorder(name, orderedIds) {
    const list = table(name);
    const rank = {};
    orderedIds.forEach((id, i) => { rank[String(id)] = (i + 1) * 10; });
    list.forEach((row) => { if (rank[String(row.id)]) row.position = rank[String(row.id)]; });
    save();
  }

  function count() {
    const d = ensure();
    return TABLES.reduce((n, t) => n + d.tables[t].length, 0);
  }

  function hasLocalPhotos() {
    const d = ensure();
    return collectMediaRefs(d.tables).length > 0 || TABLES.some((t) =>
      (d.tables[t] || []).some((row) => IMAGE_KEYS.some((k) => /^data:/i.test(String(row[k] || '')))));
  }

  /* --------------------------------------------------- remembered sign-in
     The built-in administrator has no Supabase session to come back to, so
     the sign-in itself is remembered here (with an expiry) — otherwise every
     page change would silently drop admin mode and the draft with it.        */
  const SESSION_KEY = 'redefine_admin_local_session_v1';
  function rememberSession(hours) {
    if (!alive) return false;
    const ttl = Math.max(1, Number(hours) || 12) * 3600 * 1000;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now(), exp: Date.now() + ttl })); return true; }
    catch (e) { return false; }
  }
  function sessionAlive() {
    if (!alive) return false;
    try {
      const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return !!(raw && raw.exp && raw.exp > Date.now());
    } catch (e) { return false; }
  }
  function forgetSession() {
    if (alive) { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } }
  }

  /* "Not now" on the publish prompt: the draft stays, but this tab shows the
     live content until the tab is closed */
  const LATER_KEY = 'redefine_draft_later_v1';
  const draftPaused = () => { try { return sessionStorage.getItem(LATER_KEY) === '1'; } catch (e) { return false; } };
  const pauseDraft = (on) => { try { if (on) sessionStorage.setItem(LATER_KEY, '1'); else sessionStorage.removeItem(LATER_KEY); } catch (e) { /* ignore */ } };

  window.SiteStore = {
    key: KEY,
    available: alive,
    ready: ready,
    mediaPersistent: () => mediaPersistent,
    active: () => !!(ensure().active),
    hasRows: () => count() > 0,
    hasLocalPhotos: hasLocalPhotos,
    lastError: () => lastError,
    outOfSpace: () => quotaHit(lastError),
    rememberSession: rememberSession,
    sessionAlive: sessionAlive,
    forgetSession: forgetSession,
    draftPaused: draftPaused,
    pauseDraft: pauseDraft,
    savesAt: () => (ensure().savedAt),
    tables: () => ensure().tables,
    begin: begin,
    clear: clear,
    insert: insert,
    insertMany: insertMany,
    update: update,
    updateWhere: updateWhere,
    remove: remove,
    reorder: reorder,
    count: count,
    newId: uid,
    putPhoto: putPhoto,
    getPhotoBlob: getPhotoBlob,
    resolveUrl: resolveUrl,
    isMediaRef: isMediaRef
  };
})();
