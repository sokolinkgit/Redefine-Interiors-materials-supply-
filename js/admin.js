/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — ADMIN OVERLAY ("ghost mode")
   --------------------------------------------------------------------------
   Loaded on demand by js/ghost.js. There is no /admin page: once signed in,
   the administrator looks at the ordinary website — the same hero, the same
   cards, the same services page — with a small toolbar floating on every
   block they are allowed to change.

     ✎  edit everything about that block (photo + the text under it)
     ★  feature a design in the homepage slideshow / take it out again
     ⇄  move it earlier / later
     ⧉  duplicate it
     ◉  hide it from visitors (it stays visible to you, dimmed)
     ✕  delete it

   On top of the page sits one thin bar (never over the content — the page is
   pushed down by its height) with:

     • who is signed in and whether Supabase is connected
     • Slideshow  — tick which design photos rotate on the home page
     • Categories — add / rename / reorder / hide / delete the filter chips of
                    the Designs, Materials and Services pages
     • Sign out

   Two ways to be signed in, both invisible to visitors:
     1. Supabase Auth, exactly as before (admins table + Row Level Security):
        every change is published to the database for everybody.
     2. The built-in account in js/config.js (phone + password): always works.
        If the Supabase user of that phone number does not exist yet — or the
        database cannot be reached — the changes are kept in this browser only
        (js/store.js) and the bar says so.

   Security lives in Supabase (Row Level Security + public.admins): a visitor
   who downloads this file can see the forms but every cloud write is rejected
   by the database. Mode 2 never leaves the device it was typed on.
   ========================================================================== */
(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const sb = window.SiteSupabase;
  const store = window.SiteStore;
  const BUILTIN = cfg.defaultAdmin || null;

  if (!sb && !BUILTIN) return;          // nothing to sign in with at all

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const esc = (v) => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const state = {
    admin: null,        // { id, email, phone, full_name, role, local? }
    active: false,      // bar + toolbars on screen
    editing: null,      // { kind, id }
    dirty: false,
    catsKind: 'design', // which tab the Categories panel shows
    panel: null         // 'categories' | 'slideshow' | null
  };

  /* typed at sign-in, kept only in memory so a device-only session can still
     retry the online account when the admin publishes or bulk-uploads */
  let sessionCreds = null;

  /* ======================================================================
     1. ICONS the site does not already have
     ====================================================================== */
  const svg = (inner) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';

  const AI = {
    pencil: svg('<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m14.5 6.5 3 3"/>'),
    eye: svg('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M4 4l16 16"/><path d="M9.6 5.9A9.6 9.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3.3 4.1"/><path d="M6.4 7.9A16.7 16.7 0 0 0 2.5 12S6 18.2 12 18.2a9.4 9.4 0 0 0 3.4-.6"/>'),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2.4"/><path d="M5.5 15H4.4A1.4 1.4 0 0 1 3 13.6V4.4A1.4 1.4 0 0 1 4.4 3h9.2A1.4 1.4 0 0 1 15 4.4v1.1"/>'),
    left: svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
    right: svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>'),
    up: svg('<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>'),
    down: svg('<path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/>'),
    upload: svg('<path d="M12 16V4.5"/><path d="m7.5 9 4.5-4.5L16.5 9"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>'),
    logout: svg('<path d="M15 4.5h3.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M11 8l-4 4 4 4"/><path d="M7 12h9"/>'),
    lock: svg('<rect x="4.5" y="10" width="15" height="10.5" rx="2.4"/><path d="M8 10V7.4a4 4 0 0 1 8 0V10"/>'),
    refresh: svg('<path d="M20 11a8 8 0 1 0-1.6 6"/><path d="M20 20v-5h-5"/>'),
    shield: svg('<path d="M12 21.5s7.5-3.4 7.5-9.6V5.4L12 2.2 4.5 5.4v6.5c0 6.2 7.5 9.6 7.5 9.6z"/><path d="m9.2 12 2 2 3.6-3.8"/>'),
    alert: svg('<path d="M12 3.5 22 20H2z"/><path d="M12 10v4M12 17.2v.1"/>'),
    cloud: svg('<path d="M6.5 18.5h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 9.4a4.6 4.6 0 0 0 .3 9.1z"/>'),
    /* the site already draws these, but the overlay must work on its own too */
    x: svg('<path d="M18.5 5.5 5.5 18.5M5.5 5.5l13 13"/>'),
    plus: svg('<path d="M12 5.5v13M5.5 12h13"/>'),
    check: svg('<path d="M20 6.5 9.4 17.5 4 12"/>'),
    trash: svg('<path d="M3.5 6.5h17M9 6.5v-2h6v2M6.5 6.5 7.6 20h8.8l1.1-13.5M10.5 10.5v6M13.5 10.5v6"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" focusable="false">' +
      '<path d="M12 2.6l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.66l-5.9 3.1 1.13-6.57L2.45 9.54l6.6-.96z"/></svg>',
    starOutline: svg('<path d="M12 2.6l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.66l-5.9 3.1 1.13-6.57L2.45 9.54l6.6-.96z"/>'),
    tag: svg('<path d="M20.6 13.4 12.9 21a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 2.5 12.6V4A1.5 1.5 0 0 1 4 2.5h8.6a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.7z"/><circle cx="7.5" cy="7.5" r="1.4"/>')
  };
  const siteIcons = () => (window.Site && window.Site.icons) || {};
  const icon = (name) => AI[name] || siteIcons()[name] || '';

  /* ======================================================================
     2. WHAT CAN BE EDITED — one entry per Supabase table
     ====================================================================== */
  const SWATCHES = ['mdf', 'laminate', 'hardware', 'steel', 'gypsum', 'aluminium', 'tile', 'fluted', 'quartz', 'led'];
  const MATERIAL_ICONS = ['box', 'palette', 'wrench', 'layers', 'layers2', 'window', 'spark', 'bulb', 'tag'];
  const SERVICE_ICONS = ['cabinet', 'wardrobe', 'window', 'layers', 'shop', 'wrench', 'ruler', 'spark', 'box'];

  const KIND_LABEL = { design: 'Designs', material: 'Materials', service: 'Services' };
  const CAT_KINDS = ['design', 'material', 'service'];

  /* the chips an editor can pick from = whatever the Categories panel holds */
  const categoryOptions = (kind) => (window.SiteContent && window.SiteContent.categoryList
    ? window.SiteContent.categoryList(kind).map((c) => c.name)
    : []);

  const COLLECTIONS = {
    design: {
      table: 'designs',
      folder: 'designs',
      kind: 'design',
      label: 'Design',
      plural: 'Designs',
      where: 'the Designs page and the homepage grid',
      list: () => (window.Site ? window.Site.lists.designs() : []),
      title: (r) => r.title || 'Design (no name yet)',
      bulk: true,
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', required: true, group: 'Photo',
          variants: ['image_url_760', 'image_url_480'],
          help: 'This is also the picture shown in the homepage slideshow when the design is ticked below (about 1376 × 900 looks best).' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo',
          help: 'Leave blank to use “<Title> — <Category> by Redefine Interiors”.' },
        { key: 'is_featured', label: 'Show in the homepage slideshow', type: 'toggle', group: 'Homepage slideshow',
          default: false, help: 'Tick to rotate this photo on the home page. The slideshow plays the ticked designs in the order of the Designs page.' },
        { key: 'title', label: 'Name', type: 'text', group: 'Text under the photo',
          placeholder: 'Modern L-Shaped Kitchen Cabinets',
          help: 'Optional. Without a name visitors see just the photo and the quotation button — add it any time.' },
        { key: 'summary', label: 'Summary', type: 'textarea', group: 'Text under the photo',
          help: 'Kept for your records and the WhatsApp conversation — visitors never see it. Cards and the enlarged photo show only the picture, the name and the WhatsApp button.' },
        { key: 'features', label: 'What is included', type: 'lines', group: 'Text under the photo',
          help: 'One line each. Kept for your records — not shown to visitors.' },
        { key: 'materials', label: 'Materials used', type: 'lines', group: 'Text under the photo', help: 'One line each. Kept for your records — not shown to visitors.' },
        { key: 'category', label: 'Category', type: 'combo', options: () => categoryOptions('design'), group: 'Card details',
          help: 'Drives the filters on the Designs page. Add a new one in the bar above → Categories.' },
        { key: 'lead_time', label: 'Typical time', type: 'text', group: 'Card details', placeholder: '2 – 3 weeks' },
        { key: 'unit', label: 'Scope note', type: 'text', group: 'Card details', placeholder: 'per sqm',
          help: 'Optional — appears in the WhatsApp quotation message.' },
        { key: 'position', label: 'Order', type: 'number', group: 'Placement',
          help: 'Lower numbers appear first — on the Designs page, in the homepage grid and in the slideshow.' },
        { key: 'is_active', label: 'Show on the website', type: 'toggle', group: 'Placement' }
      ]
    },

    material: {
      table: 'materials',
      folder: 'materials',
      kind: 'material',
      label: 'Material',
      plural: 'Materials',
      where: 'the Materials page and the homepage grid',
      list: () => (window.Site ? window.Site.lists.materials() : []),
      title: (r) => r.name || 'Material (no name yet)',
      bulk: true,
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', group: 'Photo',
          variants: ['image_url_760', 'image_url_480'],
          help: 'Optional. Without a photo the card shows the designed swatch below instead.' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo' },
        { key: 'name', label: 'Name', type: 'text', group: 'Text under the photo',
          placeholder: '18mm MDF Board',
          help: 'Optional. Without a name visitors see just the photo and the quotation button — add it any time.' },
        { key: 'note', label: 'Note', type: 'textarea', group: 'Text under the photo',
          help: 'Kept for your records — material cards show only the photo, the name and the WhatsApp request button, so visitors never see this.' },
        { key: 'category', label: 'Category', type: 'combo', options: () => categoryOptions('material'), group: 'Card details',
          help: 'Drives the filters on the Materials page. Add a new one in the bar above → Categories.' },
        { key: 'unit', label: 'Unit', type: 'text', group: 'Card details', placeholder: 'per 8×4ft sheet' },
        { key: 'badge', label: 'Badge', type: 'text', group: 'Card details', placeholder: 'In stock' },
        { key: 'swatch', label: 'Swatch (when there is no photo)', type: 'select', options: SWATCHES, group: 'Card details' },
        { key: 'icon', label: 'Icon (when there is no photo)', type: 'select', options: MATERIAL_ICONS, group: 'Card details' },
        { key: 'position', label: 'Order', type: 'number', group: 'Placement',
          help: 'Lower numbers appear first. The homepage shows the first six.' },
        { key: 'is_active', label: 'Show on the website', type: 'toggle', group: 'Placement' }
      ]
    },

    service: {
      table: 'services',
      folder: 'services',
      kind: 'service',
      label: 'Service',
      plural: 'Services',
      where: 'the Services page, the homepage cards and every service grid',
      list: () => (window.Site ? window.Site.lists.services() : []),
      title: (r) => r.title || 'Untitled service',
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', group: 'Photo',
          variants: ['image_url_760', 'image_url_480'], help: 'Used on the card and on the big Services page block.' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo' },
        { key: 'title', label: 'Title', type: 'text', required: true, group: 'Card',
          placeholder: 'Kitchen Cabinets' },
        { key: 'card_text', label: 'Card text', type: 'textarea', group: 'Card',
          help: 'The one or two lines shown under the title on the homepage card.' },
        { key: 'category', label: 'Category', type: 'combo', options: () => categoryOptions('service'), group: 'Card',
          help: 'Drives the filters at the top of the Services page. Add a new one in the bar above → Categories.' },
        { key: 'icon', label: 'Icon', type: 'select', options: SERVICE_ICONS, group: 'Card' },
        { key: 'slug', label: 'Slug', type: 'slug', group: 'Card',
          help: 'Lowercase, dashes only — it is the anchor on services.html and the key of the WhatsApp button.' },
        { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Services page block', placeholder: '01 · Kitchens' },
        { key: 'block_title', label: 'Block heading', type: 'text', group: 'Services page block', placeholder: 'Kitchen cabinets' },
        { key: 'body', label: 'Block paragraph', type: 'textarea', group: 'Services page block', rows: 5 },
        { key: 'meta', label: 'Highlights', type: 'pairs', group: 'Services page block',
          help: 'Up to three bold pairs under the paragraph, e.g. “18mm boards / Moisture-resistant”.' },
        { key: 'bullets', label: 'Checklist', type: 'lines', group: 'Services page block', help: 'One line each.' },
        { key: 'cta_label', label: 'WhatsApp button label', type: 'text', group: 'Services page block',
          placeholder: 'Request kitchen quotation' },
        { key: 'link_label', label: 'Second button label', type: 'text', group: 'Services page block',
          placeholder: 'See kitchen designs' },
        { key: 'link_href', label: 'Second button link', type: 'text', group: 'Services page block',
          placeholder: 'designs.html' },
        { key: 'position', label: 'Order', type: 'number', group: 'Placement' },
        { key: 'is_active', label: 'Show on the website', type: 'toggle', group: 'Placement' }
      ]
    },

    /* the filter chips themselves — edited from the Categories panel */
    category: {
      table: 'categories',
      folder: 'misc',
      kind: 'category',
      label: 'Category',
      plural: 'Categories',
      where: 'the filter bars of the Designs, Materials and Services pages',
      list: () => [],
      title: (r) => r.name || 'Untitled category',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, group: 'Category', placeholder: 'Kitchen Cabinets' },
        { key: 'kind', label: 'Belongs to', type: 'select', options: ['design', 'material', 'service'], group: 'Category' },
        { key: 'position', label: 'Order', type: 'number', group: 'Placement' },
        { key: 'is_active', label: 'Show in the filters', type: 'toggle', group: 'Placement' }
      ]
    }
  };

  /* grid → which collection its "+" tile creates */
  const GRID_KIND = [
    { sel: '[data-design-grid]', kind: 'design' },
    { sel: '[data-material-grid]', kind: 'material' },
    { sel: '[data-services]', kind: 'service' },
    { sel: '[data-service-blocks]', kind: 'service' }
  ];

  /* ======================================================================
     3. SHELL — admin bar, sign-in panel, editor drawer, panels, confirm
     ====================================================================== */
  let shell = null;

  function ensureShell() {
    if (shell) return shell;

    const wrap = document.createElement('div');
    wrap.className = 'admin-ui';
    wrap.innerHTML = [
      '<div class="admin-scrim" data-admin-scrim></div>',

      /* ---- the bar: always at the top, never over the content ---------- */
      '<div class="admin-bar" data-admin-bar role="region" aria-label="Administrator bar">',
      '  <div class="admin-bar__inner">',
      '    <span class="admin-bar__brand">' + icon('shield') + '<b>Admin</b></span>',
      '    <span class="admin-bar__who" data-bar-who></span>',
      '    <span class="admin-bar__status" data-bar-status></span>',
      '    <span class="admin-bar__actions">',
      '      <button class="admin-chip admin-chip--go" type="button" data-bar="publish" style="display:none">' + icon('upload') + ' Publish device changes</button>',
      '      <button class="admin-chip" type="button" data-bar="discard" style="display:none">' + icon('trash') + ' Discard</button>',
      '      <button class="admin-chip" type="button" data-bar="slideshow">' + icon('star') + ' Slideshow</button>',
      '      <button class="admin-chip" type="button" data-bar="categories">' + icon('tag') + ' Categories</button>',
      '      <button class="admin-chip admin-chip--danger" type="button" data-bar="signout">' + icon('logout') + ' Sign out</button>',
      '    </span>',
      '  </div>',
      '</div>',

      /* ---- sign in ---------------------------------------------------- */
      '<div class="admin-login" data-admin-login role="dialog" aria-modal="true" aria-label="Administrator sign in">',
      '  <div class="admin-login__panel">',
      '    <button class="admin-x" type="button" data-login-close aria-label="Close sign in">' + icon('x') + '</button>',
      '    <span class="admin-eyebrow">' + icon('lock') + ' Staff only</span>',
      '    <h3>Admin sign in</h3>',
      '    <p class="admin-login__lead">Use the <b>phone number or e-mail address</b> of your admin account, and its password.</p>',
      '    <form class="admin-login__form" data-login-form novalidate>',
      '      <div class="field">',
      '        <label for="admin-id">Phone number or e-mail</label>',
      '        <input id="admin-id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Phone number or e-mail" required>',
      '      </div>',
      '      <div class="field">',
      '        <label for="admin-pw">Password</label>',
      '        <span class="admin-pw">',
      '          <input id="admin-pw" type="password" autocomplete="new-password" placeholder="Password" required>',
      '          <button class="admin-pw__eye" type="button" data-pw-toggle aria-label="Show password">' + icon('eye') + '</button>',
      '        </span>',
      '      </div>',
      '      <p class="admin-error" data-login-error role="alert"></p>',
      '      <button class="btn btn--gold btn--block" type="submit" data-login-submit>Sign in</button>',
      '    </form>',
      '    <p class="admin-login__foot" data-login-foot></p>',
      '  </div>',
      '</div>',

      /* ---- editor ----------------------------------------------------- */
      '<aside class="admin-drawer" data-admin-drawer role="dialog" aria-modal="true" aria-label="Edit content" aria-hidden="true">',
      '  <div class="admin-drawer__head">',
      '    <div>',
      '      <span class="admin-eyebrow" data-editor-where></span>',
      '      <h3 data-editor-title>Edit</h3>',
      '    </div>',
      '    <button class="admin-x" type="button" data-editor-close aria-label="Close editor">' + icon('x') + '</button>',
      '  </div>',
      '  <div class="admin-drawer__body" data-editor-body></div>',
      '  <p class="admin-error admin-error--foot" data-editor-error role="alert"></p>',
      '  <div class="admin-drawer__foot">',
      '    <button class="btn btn--danger" type="button" data-editor-delete>' + icon('trash') + ' Delete</button>',
      '    <button class="btn btn--gold" type="button" data-editor-save>' + icon('check') + ' <span>Save</span></button>',
      '  </div>',
      '</aside>',

      /* ---- homepage slideshow -----------------------------------------
         Every photo from the Designs Gallery is listed; the ones currently
         rotating on the home page are ticked, the rest are not. Tapping only
         stages the change — "Save" writes it, and the slideshow then shows
         exactly the ticked photos, in gallery order. */
      '<div class="admin-modal" data-admin-slides role="dialog" aria-modal="true" aria-label="Homepage slideshow" aria-hidden="true">',
      '  <div class="admin-modal__panel">',
      '    <div class="admin-modal__head">',
      '      <div>',
      '        <span class="admin-eyebrow">' + icon('star') + ' Home page</span>',
      '        <h3>Homepage slideshow</h3>',
      '      </div>',
      '      <button class="admin-x" type="button" data-slides-close aria-label="Close">' + icon('x') + '</button>',
      '    </div>',
      '    <p class="admin-modal__lead">Every photo in the Designs Gallery is listed below — the ones that rotate on the ',
      '      home page right now are ticked, all the others are not. Tap a photo to select or deselect it, then press ',
      '<b>Save</b> — the home page slideshow then shows exactly the ticked photos, in this order.</p>',
      '    <div class="admin-modal__body" data-slides-body></div>',
      '    <p class="admin-modal__status" data-slides-status></p>',
      '    <div class="admin-modal__foot admin-slides__foot">',
      '      <span class="admin-slides__count" data-slides-count></span>',
      '      <button class="btn btn--light" type="button" data-slides-cancel>Cancel</button>',
      '      <button class="btn btn--gold" type="button" data-slides-save disabled>' + icon('check') + ' <span>Save slideshow</span></button>',
      '    </div>',
      '  </div>',
      '</div>',

      /* ---- categories ------------------------------------------------- */
      '<div class="admin-modal" data-admin-cats role="dialog" aria-modal="true" aria-label="Categories" aria-hidden="true">',
      '  <div class="admin-modal__panel">',
      '    <div class="admin-modal__head">',
      '      <div>',
      '        <span class="admin-eyebrow">' + icon('tag') + ' Filters</span>',
      '        <h3>Categories</h3>',
      '      </div>',
      '      <button class="admin-x" type="button" data-cats-close aria-label="Close">' + icon('x') + '</button>',
      '    </div>',
      '    <div class="admin-tabs" data-cats-tabs role="tablist">',
      '      <button class="admin-tab is-active" type="button" role="tab" data-cats-tab="design">Designs</button>',
      '      <button class="admin-tab" type="button" role="tab" data-cats-tab="material">Materials</button>',
      '      <button class="admin-tab" type="button" role="tab" data-cats-tab="service">Services</button>',
      '    </div>',
      '    <p class="admin-modal__lead" data-cats-lead></p>',
      '    <div class="admin-modal__body" data-cats-body></div>',
      '    <form class="admin-modal__foot" data-cats-form>',
      '      <input type="text" data-cats-new placeholder="New category name" aria-label="New category name" autocomplete="off">',
      '      <button class="btn btn--gold" type="submit">' + icon('plus') + ' Add</button>',
      '    </form>',
      '  </div>',
      '</div>',

      /* ---- upload many photos ----------------------------------------- */
      '<div class="admin-modal" data-admin-bulk role="dialog" aria-modal="true" aria-label="Upload many photos" aria-hidden="true">',
      '  <div class="admin-modal__panel">',
      '    <div class="admin-modal__head">',
      '      <div>',
      '        <span class="admin-eyebrow">' + icon('upload') + ' <span data-bulk-kind>Designs</span></span>',
      '        <h3>Upload many photos</h3>',
      '      </div>',
      '      <button class="admin-x" type="button" data-bulk-close aria-label="Close">' + icon('x') + '</button>',
      '    </div>',
      '    <p class="admin-modal__lead" data-bulk-lead></p>',
      '    <p class="admin-bulk__warn" data-bulk-warn hidden></p>',
      '    <div class="admin-modal__body admin-bulk">',
      '      <label class="admin-bulk__cat"><span>Category for these photos <em>(optional)</em></span>',
      '        <select data-bulk-cat></select></label>',
      '      <div class="admin-drop admin-drop--bulk" data-bulk-drop tabindex="0" role="button" aria-label="Choose photos">',
      '        <span class="admin-drop__cta">' + icon('upload') + '<b>Choose photos</b>',
      '          <small>Tap to open your gallery and select as many as you like · JPG, PNG or WebP up to 8 MB each</small></span>',
      '      </div>',
      '      <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif" multiple data-bulk-files hidden>',
      '      <ul class="admin-bulk__list" data-bulk-list></ul>',
      '    </div>',
      '    <div class="admin-modal__foot admin-bulk__foot">',
      '      <span class="admin-bulk__status" data-bulk-status aria-live="polite"></span>',
      '      <button class="btn btn--gold" type="button" data-bulk-start disabled>' + icon('upload') + ' <span>Upload</span></button>',
      '    </div>',
      '  </div>',
      '</div>',

      /* ---- confirm ---------------------------------------------------- */
      '<div class="admin-confirm" data-admin-confirm role="alertdialog" aria-modal="true" aria-hidden="true">',
      '  <div class="admin-confirm__panel">',
      '    <h3 data-confirm-title>Are you sure?</h3>',
      '    <p data-confirm-text></p>',
      '    <div class="admin-confirm__btns">',
      '      <button class="btn btn--light" type="button" data-confirm-no>Cancel</button>',
      '      <button class="btn btn--danger" type="button" data-confirm-yes>Delete</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(wrap);
    shell = wrap;

    /* the bar has a different height on every screen: tell the CSS */
    const measure = () => {
      const bar = $('[data-admin-bar]', shell);
      if (bar) document.documentElement.style.setProperty('--admin-bar-h', bar.offsetHeight + 'px');
    };
    window.addEventListener('resize', measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe($('[data-admin-bar]', shell));

    wireShell();
    measure();
    return shell;
  }

  function wireShell() {
    const scrim = $('[data-admin-scrim]', shell);

    /* ---- sign in ---- */
    const login = $('[data-admin-login]', shell);
    const form = $('[data-login-form]', shell);
    const err = $('[data-login-error]', shell);
    const submit = $('[data-login-submit]', shell);

    /* the form is never pre-filled: the number and the password are typed
       every time, and cleared again whenever the panel closes */
    $('[data-login-foot]', shell).textContent = 'For staff of Redefine Interiors only. Forgotten the password? Ask the site owner.';

    scrim.addEventListener('click', () => {
      if (login.classList.contains('is-open')) closeLogin();
      else if ($('[data-admin-drawer]', shell).classList.contains('is-open')) closeEditor();
      else closePanels();
    });

    $('[data-login-close]', shell).addEventListener('click', closeLogin);

    $('[data-pw-toggle]', shell).addEventListener('click', (e) => {
      const input = $('#admin-pw', shell);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      e.currentTarget.innerHTML = show ? icon('eyeOff') : icon('eye');
      e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = $('#admin-id', shell).value.trim();
      const pw = $('#admin-pw', shell).value;
      err.textContent = '';
      if (!id || !pw) { err.textContent = 'Enter both your phone number/e-mail and your password.'; return; }

      submit.disabled = true;
      submit.textContent = 'Signing in…';
      const result = await signIn(id, pw);
      submit.disabled = false;
      submit.textContent = 'Sign in';

      if (result.error) { err.textContent = result.error; return; }
      closeLogin();
      enter(result.admin);
      if (result.notice) toast(result.notice, 'warn');
    });

    login.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLogin(); });

    /* ---- editor ---- */
    $('[data-editor-close]', shell).addEventListener('click', () => closeEditor());
    $('[data-editor-save]', shell).addEventListener('click', () => saveEditor());
    $('[data-editor-delete]', shell).addEventListener('click', () => {
      const ed = state.editing;
      if (!ed || !ed.uuid) return;
      const col = COLLECTIONS[ed.kind];
      confirmDialog({
        title: 'Delete this ' + col.label.toLowerCase() + '?',
        text: '“' + col.title(ed.item) + '” will be removed from ' + col.where + '. This cannot be undone.',
        yesLabel: 'Delete',
        danger: true
      }).then((ok) => { if (ok) removeRecord(ed.kind, ed.uuid); });
    });

    /* ---- confirm ---- */
    $('[data-confirm-no]', shell).addEventListener('click', () => settleConfirm(false));
    $('[data-confirm-yes]', shell).addEventListener('click', () => settleConfirm(true));

    /* ---- bar buttons ---- */
    $('[data-bar="slideshow"]', shell).addEventListener('click', () => openPanel('slideshow'));
    $('[data-bar="categories"]', shell).addEventListener('click', () => openPanel('categories'));
    $('[data-bar="signout"]', shell).addEventListener('click', () => signOut());
    $('[data-bar="publish"]', shell).addEventListener('click', () => {
      if (store.pauseDraft) store.pauseDraft(false);
      onPublishClick();
    });
    $('[data-bar="discard"]', shell).addEventListener('click', () => discardDraft());

    $('[data-slides-close]', shell).addEventListener('click', closePanels);
    $('[data-cats-close]', shell).addEventListener('click', closePanels);
    $('[data-bulk-close]', shell).addEventListener('click', () => { if (!bulk.busy) closePanels(); });
    wireBulk();

    /* categories: tabs, add, rename, reorder, hide, delete */
    $$('[data-cats-tab]', shell).forEach((tab) => tab.addEventListener('click', () => showCatTab(tab.dataset.catsTab)));
    $('[data-cats-form]', shell).addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('[data-cats-new]', shell);
      addCategory(state.catsKind, input.value).then((ok) => { if (ok) input.value = ''; });
    });
    $('[data-cats-body]', shell).addEventListener('click', (e) => {
      const row = e.target.closest('[data-cat-id]');
      if (!row) return;
      const id = row.dataset.catId;
      const move = e.target.closest('[data-cat-move]');
      if (move) return moveCategory(id, parseInt(move.dataset.catMove, 10));
      if (e.target.closest('[data-cat-toggle]')) return toggleCategory(id);
      if (e.target.closest('[data-cat-delete]')) return deleteCategory(id, row.dataset.catName);
    });
    /* a category is renamed on blur / Enter (the change event), so typing the
       new name never fires a request per keystroke */
    $('[data-cats-body]', shell).addEventListener('change', (e) => {
      const input = e.target.closest('[data-cat-name-input]');
      if (!input) return;
      const row = input.closest('[data-cat-id]');
      const before = row.getAttribute('data-cat-name');
      const after = input.value.trim();
      if (!after || after === before) { input.value = before; return; }
      renameCategory(row.getAttribute('data-cat-id'), before, after);
    });
    $('[data-cats-body]', shell).addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.closest('[data-cat-name]')) { e.preventDefault(); e.target.blur(); }
    });

    /* slideshow: tapping a photo only stages the selection — "Save" writes
       it (the admin sees the whole choice first, nothing changes behind
       their back while they are still picking) */
    $('[data-slides-body]', shell).addEventListener('change', (e) => {
      const box = e.target.closest('[data-slide-id]');
      if (!box) return;
      slidesToggle(box.dataset.slideId, box.checked);
    });
    $('[data-slides-save]', shell).addEventListener('click', saveSlides);
    $('[data-slides-cancel]', shell).addEventListener('click', () => {
      /* re-rendering from the stored state drops anything only staged */
      renderSlidesPanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if ($('[data-admin-confirm]', shell).classList.contains('is-open')) settleConfirm(false);
      else if ($('[data-admin-drawer]', shell).classList.contains('is-open')) closeEditor();
      else if (state.panel) closePanels();
      else if ($('[data-admin-login]', shell).classList.contains('is-open')) closeLogin();
    });
  }

  /* ------------------------------------------------------------- login UI */
  function openLogin() {
    ensureShell();
    const login = $('[data-admin-login]', shell);
    $('[data-login-error]', shell).textContent = '';
    clearLoginForm();
    login.classList.add('is-open');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    document.body.classList.add('admin-no-scroll');
    setTimeout(() => { const f = $('#admin-id', shell); if (f) f.focus(); }, 120);
  }

  function clearLoginForm() {
    if (!shell) return;
    const id = $('#admin-id', shell);
    const pw = $('#admin-pw', shell);
    if (id) id.value = '';
    if (pw) { pw.value = ''; pw.type = 'password'; }
    const eye = $('[data-pw-toggle]', shell);
    if (eye) { eye.innerHTML = icon('eye'); eye.setAttribute('aria-label', 'Show password'); }
  }

  function closeLogin() {
    if (!shell) return;
    clearLoginForm();
    $('[data-admin-login]', shell).classList.remove('is-open');
    if (!$('[data-admin-drawer]', shell).classList.contains('is-open') && !state.panel) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
  }

  function openBar() {
    ensureShell();
    document.body.classList.add('has-admin-bar');
    $('[data-admin-bar]', shell).classList.add('is-open');
  }

  /* ---------------------------------------------------------- confirm UI */
  let confirmResolver = null;
  function confirmDialog(opts) {
    ensureShell();
    const box = $('[data-admin-confirm]', shell);
    $('[data-confirm-title]', shell).textContent = opts.title || 'Are you sure?';
    $('[data-confirm-text]', shell).textContent = opts.text || '';
    const yes = $('[data-confirm-yes]', shell);
    yes.textContent = opts.yesLabel || 'Delete';
    yes.classList.toggle('btn--danger', opts.danger !== false);
    const no = $('[data-confirm-no]', shell);
    no.textContent = opts.noLabel || 'Cancel';
    box.classList.add('is-open');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    return new Promise((resolve) => { confirmResolver = resolve; });
  }
  function settleConfirm(value) {
    if (!shell) return;
    $('[data-admin-confirm]', shell).classList.remove('is-open');
    if (!$('[data-admin-login]', shell).classList.contains('is-open') &&
        !$('[data-admin-drawer]', shell).classList.contains('is-open') && !state.panel) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
    }
    if (confirmResolver) { const r = confirmResolver; confirmResolver = null; r(value); }
  }

  /* ----------------------------------------------------------- side panels */
  function openPanel(which, kind) {
    ensureShell();
    state.panel = which;
    if (which === 'categories') {
      showCatTab(kind || state.catsKind || 'design', true);
    } else if (which === 'slideshow') {
      renderSlidesPanel();
    }
    const box = $('[data-admin-' + (which === 'categories' ? 'cats' : which === 'bulk' ? 'bulk' : 'slides') + ']', shell);
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    document.body.classList.add('admin-no-scroll');
  }

  function closePanels() {
    if (!shell) return;
    state.panel = null;
    $$('[data-admin-slides], [data-admin-cats], [data-admin-bulk]', shell).forEach((el) => {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
    });
    if (!$('[data-admin-login]', shell).classList.contains('is-open') &&
        !$('[data-admin-drawer]', shell).classList.contains('is-open')) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
  }

  /* ======================================================================
     4. SIGN-IN — Supabase first, then the built-in account
     ====================================================================== */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* 0703142874 / 0703 142 874 / 254703142874 / +254703142874 → every shape
     Supabase might have stored */
  function phoneCandidates(raw) {
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length < 9) return [];
    const out = [];
    const push = (v) => { if (v && out.indexOf(v) === -1) out.push(v); };
    if (digits.startsWith('0') && digits.length === 10) {
      push('+254' + digits.slice(1));
      push('254' + digits.slice(1));
    }
    if (digits.startsWith('254')) push('+' + digits);
    push('+' + digits);
    push(digits);
    if (digits.startsWith('0')) push(digits);
    return out;
  }

  const badCredentials = (msg) => /invalid login credentials|invalid\s+login/i.test(msg || '');

  async function sha256Hex(text) {
    try {
      if (!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest)) return null;
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.prototype.map.call(new Uint8Array(buf), (b) => ('0' + b.toString(16)).slice(-2)).join('');
    } catch (e) { return null; }
  }

  /* SHA-256 in plain JavaScript for pages served over plain http (there
     crypto.subtle is switched off), so the password is never compared in the
     clear and never has to be stored in any recoverable form */
  function sha256Sync(str) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = new TextEncoder().encode(str);
    const l = bytes.length;
    const words = [];
    for (let i = 0; i < l; i++) words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    words[(((l + 8) >> 6) << 4) + 15] = l * 8;
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Array(64);
    for (let j = 0; j < words.length; j += 16) {
      for (let t = 0; t < 64; t++) {
        if (t < 16) w[t] = words[j + t] | 0;
        else {
          const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
          const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
          w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
        }
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => ('00000000' + (x >>> 0).toString(16)).slice(-8)).join('');
  }

  /* is this the account coded into js/config.js? */
  async function matchesBuiltin(identifier, password) {
    if (!BUILTIN || !BUILTIN.passwordHash) return false;
    const digits = String(identifier).replace(/\D/g, '');
    const want = String(BUILTIN.phone || '').replace(/\D/g, '');
    const wantIntl = want.replace(/^0/, '254');
    const phoneOk = !!digits && (digits === want || digits === wantIntl || digits === String(BUILTIN.phoneE164 || '').replace(/\D/g, ''));
    const emailOk = !!BUILTIN.email &&
      String(identifier).trim().toLowerCase() === String(BUILTIN.email).trim().toLowerCase();
    if (!phoneOk && !emailOk) return false;

    const salted = (cfg.passwordSalt || 'redefine-interiors::2026::') + String(password);
    let hash = await sha256Hex(salted);
    if (!hash) { try { hash = sha256Sync(salted); } catch (e) { hash = null; } }
    return !!hash && hash === BUILTIN.passwordHash;
  }

  /* Supabase Auth, e-mail or phone — unchanged behaviour */
  async function cloudSignIn(id, password) {
    if (EMAIL_RE.test(id)) {
      const { error } = await sb.auth.signInWithPassword({ email: id, password: password });
      if (error) return { error: error };
      return finishSignIn();
    }

    const candidates = phoneCandidates(id);
    if (!candidates.length) return { error: new Error('Enter a valid phone number or e-mail address.') };

    let lastError = null;
    for (let i = 0; i < candidates.length; i++) {
      const { error } = await sb.auth.signInWithPassword({ phone: candidates[i], password: password });
      if (!error) return finishSignIn();
      lastError = error;
      if (!badCredentials(error.message)) return { error: error };
    }

    /* the account may exist with an e-mail while the admin typed the phone
       number they are known by — ask the database for the match */
    try {
      const { data } = await sb.rpc('resolve_admin_email', { p_phone: candidates[0] });
      if (data) {
        const { error } = await sb.auth.signInWithPassword({ email: data, password: password });
        if (!error) return finishSignIn();
      }
    } catch (e) { /* rpc missing — fall through */ }

    return { error: lastError || new Error('Sign-in failed.') };
  }

  /* the browser-only way in: it needs somewhere to keep the draft */
  function localSignIn() {
    if (!store || !store.available) {
      return {
        error: 'This browser is blocking saved data (a private window?), so your changes could not be kept. ' +
          'Open the site in a normal window and sign in again.'
      };
    }
    if (store.rememberSession) store.rememberSession(BUILTIN && BUILTIN.sessionHours);
    return {
      admin: localAdmin(),
      notice: 'Signed in on this device only. Photos stay on this phone until the online account is connected — other devices will not see them yet.'
    };
  }

  async function signIn(identifier, password) {
    const id = String(identifier).trim();
    const builtin = await matchesBuiltin(id, password);

    if (sb) {
      let cloud = { error: null };
      try { cloud = await cloudSignIn(id, password); } catch (e) { cloud = { error: e }; }
      if (cloud.admin) {
        sessionCreds = { id: id, password: password };
        return cloud;
      }
      /* the owner's own account always works, whatever the cloud said */
      if (builtin) {
        sessionCreds = { id: id, password: password };
        return localSignIn();
      }
      const reason = cloud.error && cloud.error.message ? friendly(cloud.error.message) : 'Sign-in failed.';
      return { error: reason };
    }

    if (builtin) {
      sessionCreds = { id: id, password: password };
      return localSignIn();
    }
    return { error: 'Wrong phone number/e-mail or password.' };
  }

  /* a device-only session retries the online account with the password just
     typed, so bulk uploads can go live the moment that account exists */
  async function promoteToCloud() {
    if (!sb || !sessionCreds) return false;
    if (state.admin && !state.admin.local) return true;
    try {
      const cloud = await cloudSignIn(sessionCreds.id, sessionCreds.password);
      if (!(cloud && cloud.admin)) return false;
      state.admin = cloud.admin;
      if (store && store.forgetSession) store.forgetSession();
      return true;
    } catch (e) { return false; }
  }

  async function ensureCloudWrites() {
    if (writePath() === 'cloud') return true;
    const promoted = await promoteToCloud();
    if (!promoted) return false;
    if (store && store.active() && store.hasRows && store.hasRows()) {
      await publishDraft();
    }
    /* if a leftover draft is still sitting here, set it aside so new live
       writes are what this device (and every other device) shows */
    if (store && store.active() && store.hasRows && store.hasRows() && store.pauseDraft) {
      store.pauseDraft(true);
    }
    if (window.SiteContent && SiteContent.load) await SiteContent.load();
    updateBar();
    decorate();
    return writePath() === 'cloud';
  }

  async function onPublishClick() {
    if (writePath() === 'cloud') return publishDraft();
    const ok = await ensureCloudWrites();
    if (!ok) {
      toast('Publishing needs the online account. Create it in Supabase → Authentication → Users with this phone number and the same password, then sign in again.', 'warn');
    }
  }

  function localAdmin() {
    return {
      id: null,
      email: (BUILTIN && BUILTIN.email) || '',
      phone: (BUILTIN && BUILTIN.phone) || '',
      full_name: (BUILTIN && BUILTIN.fullName) || 'Administrator',
      role: (BUILTIN && BUILTIN.role) || 'owner',
      local: true
    };
  }

  function friendly(message) {
    const m = String(message || '');
    if (badCredentials(m)) return 'Wrong phone number/e-mail or password.';
    if (/email not confirmed/i.test(m)) return 'That account is not confirmed yet. Confirm it in Supabase → Authentication → Users.';
    if (/phone not confirmed/i.test(m)) return 'That phone number is not confirmed yet. Confirm it in Supabase → Authentication → Users.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
    if (/fetch|network|failed to fetch/i.test(m)) return 'No connection right now. Check the internet and try again.';
    if (/sms|phone provider|twilio|messagebird/i.test(m)) return 'Wrong phone number/e-mail or password.';
    if (/not an administrator/i.test(m)) return 'That account is not an administrator of this website.';
    return m || 'Sign-in failed.';
  }

  async function finishSignIn() {
    const { data, error } = await sb.rpc('current_admin');
    if (error) return { error: new Error('Signed in, but the admin check failed: ' + error.message) };
    if (!data || !data.id) {
      await sb.auth.signOut();
      return { error: new Error('That account is not an administrator of this website.') };
    }
    try { await sb.rpc('admin_touch_login'); } catch (e) { /* cosmetic */ }
    data.local = false;
    return { admin: data };
  }

  /* called by js/ghost.js when a session already exists (page reload, next page) */
  async function resume() {
    if (store && store.ready) { try { await store.ready; } catch (e) { /* ignore */ } }
    if (sb) {
      try {
        const { data } = await sb.auth.getSession();
        if (data && data.session) {
          const { data: admin } = await sb.rpc('current_admin');
          if (admin && admin.id) { admin.local = false; enter(admin, true); return true; }
        }
      } catch (e) { /* fall through to the device sign-in */ }
    }
    if (BUILTIN && store && store.sessionAlive && store.sessionAlive()) {
      enter(localAdmin(), true);
      return true;
    }
    return false;
  }

  async function signOut() {
    const local = !!(state.admin && state.admin.local);

    const ok = await confirmDialog({
      title: 'Sign out of admin mode?',
      text: local
        ? 'Your changes stay saved on this device.'
        : 'The website stays exactly as it is for visitors.',
      yesLabel: 'Sign out',
      noLabel: 'Stay signed in',
      danger: false
    });
    if (!ok) return;

    if (sb && state.admin && !state.admin.local) {
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
    }

    sessionCreds = null;
    if (store && store.forgetSession) store.forgetSession();

    /* changes saved on this device stay — the website keeps showing them
       here, and they are published the next time the online account signs
       in on this device */
    if (local && store && store.active() && window.SiteContent && SiteContent.loadLocal) {
      await SiteContent.loadLocal();
    }

    exit();
    toast('Signed out');
  }

  /* ======================================================================
     5. ENTER / EXIT ADMIN MODE
     ====================================================================== */
  function toast(msg, kind) {
    if (window.Site && window.Site.toast) window.Site.toast(msg, kind);
    else if (window.console) console.info('[admin] ' + msg);
  }

  async function enter(admin, silent) {
    state.admin = admin;
    state.active = true;
    ensureShell();

    /* the built-in account: snapshot what the visitor sees and keep working
       from this device's own copy (js/store.js) */
    if (admin.local && store) {
      if (store.ready) { try { await store.ready; } catch (e) { /* ignore */ } }
      if (store.pauseDraft) store.pauseDraft(false);
      store.begin();
      if (window.SiteContent && SiteContent.loadLocal) await SiteContent.loadLocal();
    }

    document.body.classList.add('is-admin');
    openBar();
    updateBar();

    if (window.Site) window.Site.setShowHidden(true);   // triggers a re-render → decorate()
    decorate();

    if (!silent) {
      toast(admin.local
        ? 'Admin mode on — changes stay on this device until you publish them to the website'
        : 'Admin mode on — every change goes live straight away');
    }

    /* the online account arriving on a device that holds unpublished
       changes: offer to put them live */
    if (!admin.local && store && store.active() && store.hasRows && store.hasRows()) {
      setTimeout(() => offerPublish(!silent ? 'signin' : 'resume'), silent ? 900 : 400);
    } else if (admin.local && sessionCreds) {
      setTimeout(async () => {
        const ok = await promoteToCloud();
        if (!ok) return;
        updateBar();
        if (store && store.active() && store.hasRows && store.hasRows()) offerPublish('signin');
      }, 800);
    }
  }

  /* ---- changes saved on a device → published for everybody ------------- */
  let publishing = false;

  async function offerPublish(why) {
    if (publishing || !store || !store.active()) return;
    const n = store.count ? store.count() : 0;
    const ok = await confirmDialog({
      title: 'Publish the changes saved on this device?',
      text: 'This device holds changes to the designs, materials or categories that visitors elsewhere cannot see yet' +
        (n ? ' (' + n + ' items in total)' : '') + '. Publish them now so the whole website matches what you see here?',
      yesLabel: 'Publish now',
      noLabel: 'Not now',
      danger: false
    });
    if (ok) return publishDraft();
    /* set aside for this tab: the admin edits the live content directly */
    if (store.pauseDraft) store.pauseDraft(true);
    if (window.SiteContent && SiteContent.load) await SiteContent.load();
    updateBar();
    toast('Kept for later — use “Publish device changes” in the bar whenever you are ready');
  }

  async function discardDraft() {
    const ok = await confirmDialog({
      title: 'Discard the changes saved on this device?',
      text: 'The website on this device goes back to the published version. This cannot be undone.',
      yesLabel: 'Discard',
      noLabel: 'Keep',
      danger: true
    });
    if (!ok) return;
    store.clear();
    if (store.pauseDraft) store.pauseDraft(false);
    if (window.SiteContent && SiteContent.restore) SiteContent.restore();
    if (window.SiteContent && SiteContent.load) await SiteContent.load();
    updateBar();
    toast('Device changes discarded');
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const CLOUD_ONLY = ['created_at', 'updated_at', 'created_by', 'updated_by'];
  const KEY_OF = {
    designs: (r) => 'code:' + String(r.code || ''),
    materials: (r) => 'code:' + String(r.code || ''),
    services: (r) => 'slug:' + String(r.slug || ''),
    categories: (r) => 'cat:' + String(r.kind || '') + '/' + String(r.name || '').toLowerCase()
  };

  /* a photo that was kept inside the device copy (data: URL) → the bucket */
  async function dataUrlToFile(url, name) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], (name || 'photo') + '.jpg', { type: blob.type || 'image/jpeg' });
  }


  async function localImageToFile(url, name) {
    const src = String(url || '');
    if (!src) return null;
    if (store && store.getPhotoBlob && store.isMediaRef && store.isMediaRef(src)) {
      const blob = await store.getPhotoBlob(src);
      if (!blob) return null;
      return new File([blob], (name || 'photo') + '.jpg', { type: blob.type || 'image/jpeg' });
    }
    if (/^data:|^blob:/i.test(src)) return dataUrlToFile(src, name);
    return null;
  }

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && /^image\//.test(file.type)) return true;
    return /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name || '');
  }

  async function hasCloudSession() {
    if (!sb) return false;
    try {
      const { data } = await sb.auth.getSession();
      return !!(data && data.session);
    } catch (e) { return false; }
  }

  async function mapPool(items, limit, fn) {
    const n = items.length;
    const out = new Array(n);
    let i = 0;
    const workers = [];
    const run = async () => {
      while (i < n) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    };
    const count = Math.max(1, Math.min(limit || 1, n));
    for (let w = 0; w < count; w++) workers.push(run());
    await Promise.all(workers);
    return out;
  }


  async function publishDraft() {
    if (publishing || !sb) return;
    if (writePath() !== 'cloud') {
      toast('Publishing needs the online account — sign in with it first');
      return;
    }
    publishing = true;
    const status = $('[data-bar-status]', shell);
    const say = (m) => { if (status) status.innerHTML = icon('refresh') + '<span><b>Publishing…</b> ' + esc(m) + '</span>'; };
    const uid = state.admin && state.admin.id ? state.admin.id : null;

    try {
      const tables = store.tables();
      const order = ['categories', 'designs', 'materials', 'services'];
      let done = 0;

      for (let t = 0; t < order.length; t++) {
        const table = order[t];
        const folder = { designs: 'designs', materials: 'materials', services: 'services' }[table] || 'misc';
        const local = (tables[table] || []).slice();
        say(table + ' — reading the published copy…');
        const { data: cloudRows, error: readErr } = await sb.from(table).select('*');
        if (readErr) throw readErr;
        const byId = {}; const byKey = {};
        (cloudRows || []).forEach((r) => { byId[String(r.id)] = r; byKey[KEY_OF[table](r)] = r; });
        const keep = {};

        for (let i = 0; i < local.length; i++) {
          const row = Object.assign({}, local[i]);
          const label = row.title || row.name || row.slug || row.code || ('item ' + (i + 1));
          say(table + ' — ' + label);

          /* photos kept on the device (IndexedDB idb: refs, or leftover data: URLs) go to the bucket first */
          const src = String(row.image_url || '');
          const localPhoto = (store && store.isMediaRef && store.isMediaRef(src)) || /^data:|^blob:/i.test(src);
          if (localPhoto) {
            const file = await localImageToFile(src, slugify(label));
            if (!file) throw new Error('A photo saved on this device could not be read. Try uploading it again.');
            const up = await uploadPhoto(folder, file, label, (m) => say(label + ': ' + m));
            row.image_url = up.full; row.image_url_760 = up.sm; row.image_url_480 = up.xs;
            if (store.update) await store.update(table, local[i].id, { image_url: up.full, image_url_760: up.sm, image_url_480: up.xs });
          }

          const localId = String(row.id || '');
          CLOUD_ONLY.forEach((k) => { delete row[k]; });
          delete row.id;
          row.updated_by = uid;

          let target = UUID_RE.test(localId) && byId[localId] ? byId[localId] : byKey[KEY_OF[table](row)];
          if (target) {
            keep[String(target.id)] = true;
            const { error } = await sb.from(table).update(row).eq('id', target.id);
            if (error) throw error;
          } else {
            row.created_by = uid;
            if (UUID_RE.test(localId)) row.id = localId;
            const { data: ins, error } = await sb.from(table).insert(row).select('id').single();
            if (error) throw error;
            if (ins && ins.id) keep[String(ins.id)] = true;
          }
          done += 1;
        }

        /* whatever the admin deleted on the device is deleted for everybody */
        const gone = (cloudRows || []).filter((r) => !keep[String(r.id)]);
        for (let g = 0; g < gone.length; g++) {
          say(table + ' — removing ' + (gone[g].title || gone[g].name || gone[g].slug || ''));
          const { error } = await sb.from(table).delete().eq('id', gone[g].id);
          if (error) throw error;
        }
      }

      store.clear();
      if (store.pauseDraft) store.pauseDraft(false);
      if (window.SiteContent && SiteContent.load) await SiteContent.load();
      updateBar();
      decorate();
      toast('Published — the whole website now shows these changes (' + done + ' items)');
    } catch (err) {
      updateBar();
      toast('Publishing stopped: ' + writeError(err) + ' Nothing on this device was lost — try again.');
    } finally {
      publishing = false;
    }
  }

  function exit() {
    state.active = false;
    state.admin = null;
    state.editing = null;
    undecorate();
    closePanels();
    if (shell) {
      $('[data-admin-drawer]', shell).classList.remove('is-open');
      $('[data-admin-drawer]', shell).setAttribute('aria-hidden', 'true');
      $('[data-admin-bar]', shell).classList.remove('is-open');
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
    document.body.classList.remove('is-admin', 'has-admin-bar');
    if (window.Site) window.Site.setShowHidden(false);
  }

  function updateBar() {
    if (!shell) return;
    const who = $('[data-bar-who]', shell);
    const el = $('[data-bar-status]', shell);
    const a = state.admin || {};

    who.textContent = a.full_name || a.email || a.phone || 'administrator';
    who.title = [a.email, a.phone].filter(Boolean).join(' · ');

    const sc = window.SiteContent || {};
    const c = sc.counts || {};
    const numbers = [c.designs ? c.designs + ' designs' : '', c.materials ? c.materials + ' materials' : '',
      c.services ? c.services + ' services' : '', c.categories ? c.categories + ' categories' : '']
      .filter(Boolean).join(' · ');

    const pending = !a.local && store && store.active() && store.hasRows && store.hasRows();
    const localPending = !!(a.local && store && store.active && store.active());
    const publishBtn = $('[data-bar="publish"]', shell);
    const discardBtn = $('[data-bar="discard"]', shell);
    if (publishBtn) publishBtn.style.display = (pending || localPending) ? '' : 'none';
    if (discardBtn) discardBtn.style.display = pending ? '' : 'none';
    if (publishBtn) {
      publishBtn.innerHTML = icon('upload') + (localPending && !pending ? ' Publish to the website' : ' Publish device changes');
    }

    if (a.local) {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>Only on this device.</b> ' +
        esc(numbers || 'Ready') + ' — other phones and computers cannot see these photos until you publish them to the website.</span>';
    } else if (pending) {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>Changes waiting on this device.</b> Publish them so everybody sees them.</span>';
    } else if (sc.status === 'live') {
      el.className = 'admin-bar__status';
      el.innerHTML = icon('cloud') + '<span><b>Live.</b> ' + esc(numbers) + ' — changes go live straight away.</span>';
    } else if (sc.status === 'empty') {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>Live, but nothing is published yet.</b> Add items with the + tiles.</span>';
    } else if (sc.status === 'offline') {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>No connection right now.</b> Check the internet and reload.</span>';
    } else {
      el.className = 'admin-bar__status';
      el.innerHTML = icon('check') + '<span><b>Ready.</b> ' + esc(numbers || '') + '</span>';
    }
  }

  /* which place writes go to: 'cloud' (Supabase), 'local' (this browser) */
  function writePath() {
    if (!state.active || !state.admin) return null;
    if (state.admin.local) return store ? 'local' : null;
    /* an online administrator always writes to the cloud — also while this
       device is still showing its own unpublished draft */
    return sb ? 'cloud' : null;
  }

  async function reloadContent(silent) {
    if (!silent) toast('Reloading…');
    if (writePath() === 'local' || (store && store.active() && state.admin && state.admin.local)) {
      if (window.SiteContent && SiteContent.loadLocal) await SiteContent.loadLocal();
    } else if (window.SiteContent && window.SiteContent.load) {
      await window.SiteContent.load();
    }
    updateBar();
    if (state.panel === 'slideshow') renderSlidesPanel();
    if (state.panel === 'categories') renderCatPanel();
    decorate();
  }

  /* ======================================================================
     6. THE OVERLAY ON THE PAGE — toolbars and "+" tiles
     ====================================================================== */
  function findItem(kind, id) {
    const col = COLLECTIONS[kind];
    if (!col) return null;
    const list = col.list() || [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (String(it.uuid || '') === String(id) || String(it.id || '') === String(id) || String(it.slug || '') === String(id)) return it;
    }
    return null;
  }
  const findDesign = (id) => findItem('design', id);

  const canEdit = (item) => !!(item && item.uuid);

  function toolBtn(kind, id, act, iconName, label, extra) {
    return '<button class="admin-tool' + (extra || '') + '" type="button" data-admin-act="' + act + '"' +
      ' data-admin-kind="' + kind + '" data-admin-id="' + esc(id) + '" title="' + esc(label) + '" aria-label="' + esc(label) + '">' +
      icon(iconName) + '</button>';
  }

  function decorate() {
    if (!state.active) return;
    ensureShell();

    $$('[data-cms]').forEach((el) => {
      if (el.__adminTools) return;
      const kind = el.dataset.cms;
      const col = COLLECTIONS[kind];
      if (!col) return;
      const item = findItem(kind, el.dataset.cmsId);
      if (!canEdit(item)) return;                 // built-in fallback content — nothing in the database to edit

      const id = String(item.uuid);
      const hidden = item.active === false;
      const bar = document.createElement('div');
      bar.className = 'admin-tools';

      if (el.dataset.cmsSlide === '1') {
        /* a slide of the homepage hero: "Edit" opens the slideshow picker —
           ALL the Designs Gallery photos, the ones in the slideshow ticked
           and the rest unticked — where the administrator selects exactly
           which photos rotate and saves */
        bar.innerHTML =
          '<span class="admin-tools__tag">Slideshow</span>' +
          toolBtn('design', id, 'slideshow', 'star', 'Edit the slideshow — choose which gallery photos rotate on the home page');
      } else {
        const featured = item.featured === true;
        bar.innerHTML =
          '<span class="admin-tools__tag">' + esc(col.label) + (hidden ? ' · hidden' : '') + '</span>' +
          toolBtn(kind, id, 'edit', 'pencil', 'Edit this ' + col.label.toLowerCase()) +
          (kind === 'design'
            ? toolBtn(kind, id, 'feature', featured ? 'star' : 'starOutline',
              featured ? 'Remove from the homepage slideshow' : 'Feature in the homepage slideshow',
              featured ? ' is-on' : '')
            : '') +
          (kind === 'service' ? '' : toolBtn(kind, id, 'dup', 'copy', 'Duplicate')) +
          toolBtn(kind, id, 'move-left', 'left', 'Move earlier') +
          toolBtn(kind, id, 'move-right', 'right', 'Move later') +
          toolBtn(kind, id, 'toggle', hidden ? 'eyeOff' : 'eye',
            hidden ? 'Show on the website' : 'Hide from visitors', hidden ? ' is-off' : '') +
          toolBtn(kind, id, 'delete', 'trash', 'Delete', ' admin-tool--danger');
      }

      el.appendChild(bar);
      el.__adminTools = bar;
      el.classList.add('admin-editable');
      if (hidden) el.classList.add('admin-hidden-item');
    });

    addTiles();
  }

  function undecorate() {
    $$('.admin-tools').forEach((el) => {
      if (el.parentElement) el.parentElement.__adminTools = null;
      el.remove();
    });
    $$('.admin-add').forEach((el) => el.remove());
    $$('.admin-editable').forEach((el) => el.classList.remove('admin-editable', 'admin-hidden-item'));
  }

  function addTiles() {
    if (!state.active) return;

    GRID_KIND.forEach((g) => {
      const col = COLLECTIONS[g.kind];
      $$(g.sel).forEach((grid) => {
        if (grid.querySelector('.admin-add')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'admin-add' + (g.sel === '[data-service-blocks]' ? ' admin-add--wide' : '');
        btn.dataset.adminAct = 'new';
        btn.dataset.adminKind = g.kind;
        btn.innerHTML = icon('plus') + '<span>Add ' + esc(col.label.toLowerCase()) + '</span>' +
          '<small>It appears at the end of ' + esc(col.where) + '</small>';
        grid.appendChild(btn);

        if (col.bulk) {
          const many = document.createElement('button');
          many.type = 'button';
          many.className = 'admin-add admin-add--bulk';
          many.dataset.adminAct = 'bulk';
          many.dataset.adminKind = g.kind;
          many.innerHTML = icon('upload') + '<span>Upload many photos</span>' +
            '<small>Pick several photos from your gallery — each becomes a ' + esc(col.label.toLowerCase()) +
            ' straight away. Names can be added later.</small>';
          grid.appendChild(many);
        }
      });
    });
  }

  /* one capture-phase listener for every toolbar / tile button, so the site's
     own handlers (card click → detail pop-up) never fire for admin actions */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-admin-act]');
    if (!btn || !state.active) return;
    e.preventDefault();
    e.stopPropagation();

    const act = btn.dataset.adminAct;
    const kind = btn.dataset.adminKind;
    const id = btn.dataset.adminId;

    if (act === 'categories') {
      const k = CAT_KINDS.indexOf(kind) === -1 ? 'design' : kind;
      return openPanel('categories', k);
    }
    if (act === 'slideshow') return openPanel('slideshow');
    if (act === 'new') return openEditor(kind, null);
    if (act === 'bulk') return openBulk(kind);
    if (act === 'edit') return openEditor(kind, id);
    if (['feature', 'unfeature', 'dup', 'move-left', 'move-right', 'toggle', 'delete'].indexOf(act) !== -1 && draftBlocks()) return;
    if (act === 'feature') return setFeatured(id, !(findDesign(id) || {}).featured);
    if (act === 'unfeature') return setFeatured(id, false);
    if (act === 'dup') return duplicateRecord(kind, id);
    if (act === 'move-left') return moveRecord(kind, id, -1);
    if (act === 'move-right') return moveRecord(kind, id, 1);
    if (act === 'toggle') return toggleVisible(kind, id);
    if (act === 'delete') {
      const item = findItem(kind, id);
      const col = COLLECTIONS[kind];
      if (!item || !col) return;
      confirmDialog({
        title: 'Delete this ' + col.label.toLowerCase() + '?',
        text: '“' + col.title(item) + '” will be removed from ' + col.where + ' straight away. This cannot be undone.',
        yesLabel: 'Delete'
      }).then((ok) => { if (ok) removeRecord(kind, item.uuid); });
    }
  }, true);

  /* ======================================================================
     7. WRITING — one door for both the cloud and the browser-only store
     ====================================================================== */
  function localRows(table) {
    return (store && store.tables()[table]) || [];
  }

  const localFail = () => ({ error: new Error(store && store.outOfSpace && store.outOfSpace()
    ? 'This device could not save that change. Photos are no longer stored in the tiny browser quota — try again, or sign in with the online account so they go to the website.'
    : 'That change could not be saved on this device. Try again.') });

  async function writeUpdate(table, id, patch) {
    if (writePath() === 'local') {
      const row = await store.update(table, id, patch);
      return row ? { error: null } : localFail();
    }
    const { error } = await sb.from(table).update(patch).eq('id', id);
    return { error: error };
  }

  async function writeInsert(table, payload) {
    if (writePath() === 'local') {
      const row = await store.insert(table, payload);
      return row ? { error: null } : localFail();
    }
    const { error } = await sb.from(table).insert(payload);
    return { error: error };
  }

  async function writeDelete(table, id) {
    if (writePath() === 'local') { store.remove(table, id); return { error: null }; }
    const { error } = await sb.from(table).delete().eq('id', id);
    return { error: error };
  }

  async function writeUpdateWhere(table, match, patch) {
    if (writePath() === 'local') { store.updateWhere(table, match, patch); return { error: null }; }
    let q = sb.from(table).update(patch);
    Object.keys(match).forEach((k) => { q = q.eq(k, match[k]); });
    const { error } = await q;
    return { error: error };
  }

  /* the positions of every row of a table, in the order the admin sees them */
  function positionOrder(kind) {
    const col = COLLECTIONS[kind];
    const list = (col.list() || []).slice().sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
    return list.map((x) => x.uuid);
  }

  function maxPosition(kind) {
    const list = COLLECTIONS[kind].list() || [];
    return list.reduce((m, x) => Math.max(m, Number(x.position) || 0), 0);
  }

  function nextCode(kind) {
    const prefix = { design: 'd', material: 'm' }[kind];
    if (!prefix) return null;
    const list = COLLECTIONS[kind].list() || [];
    let max = 0;
    list.forEach((it) => {
      const m = /^([a-z])(\d+)$/i.exec(String(it.code || it.id || ''));
      if (m && m[1].toLowerCase() === prefix) max = Math.max(max, parseInt(m[2], 10));
    });
    let code;
    do { max += 1; code = prefix + String(max).padStart(2, '0'); }
    while (list.some((it) => String(it.code || it.id) === code));
    return code;
  }

  /* several new items in one go: successive codes without a re-render between */
  function codeAllocator(kind) {
    const used = {};
    (COLLECTIONS[kind].list() || []).forEach((it) => { used[String(it.code || it.id || '')] = true; });
    return () => {
      let code;
      do { code = nextCodeAfter(kind, used); } while (used[code]);
      used[code] = true;
      return code;
    };
  }
  function nextCodeAfter(kind, used) {
    const prefix = { design: 'd', material: 'm' }[kind];
    let max = 0;
    Object.keys(used).forEach((c) => {
      const m = /^([a-z])(\d+)$/i.exec(c);
      if (m && m[1].toLowerCase() === prefix) max = Math.max(max, parseInt(m[2], 10));
    });
    return prefix + String(max + 1).padStart(2, '0');
  }

  const slugify = (s) => String(s || '').toLowerCase().trim()
    .replace(/[’'"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

  function uniqueSlug(title) {
    const list = COLLECTIONS.service.list() || [];
    const base = slugify(title) || 'service';
    let slug = base;
    let i = 2;
    while (list.some((s) => s.slug === slug)) slug = base + '-' + (i++);
    return slug;
  }

  async function moveRecord(kind, id, dir) {
    const item = findItem(kind, id);
    if (!canEdit(item)) return;
    const col = COLLECTIONS[kind];

    const list = (col.list() || []).slice().sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
    const from = list.findIndex((x) => String(x.uuid) === String(item.uuid));
    const to = from + dir;
    if (from < 0 || to < 0 || to >= list.length) { toast(dir < 0 ? 'Already first' : 'Already last'); return; }

    list.splice(to, 0, list.splice(from, 1)[0]);
    try {
      if (writePath() === 'local') {
        store.reorder(col.table, list.map((x) => x.uuid));
      } else {
        await Promise.all(list.map((x, i) =>
          sb.from(col.table).update({ position: (i + 1) * 10 }).eq('id', x.uuid)));
      }
      await reloadContent(true);
    } catch (err) { toast(writeError(err)); }
  }

  async function toggleVisible(kind, id) {
    const col = COLLECTIONS[kind];
    const item = findItem(kind, id);
    if (!col || !canEdit(item)) return;
    const next = item.active === false;
    const { error } = await writeUpdate(col.table, item.uuid, { is_active: next });
    if (error) return toast(writeError(error));
    item.active = next;                       // instant feedback …
    if (window.Site) window.Site.refresh();    // … then the real thing
    await reloadContent(true);
    toast(next ? 'Visible on the website again' : 'Hidden from visitors (you can still see it)');
  }

  async function removeRecord(kind, uuid) {
    const col = COLLECTIONS[kind];
    const { error } = await writeDelete(col.table, uuid);
    if (error) return toast(writeError(error));
    closeEditor(true);
    await reloadContent(true);
    toast(col.label + ' deleted');
  }

  async function duplicateRecord(kind, id) {
    const col = COLLECTIONS[kind];
    const item = findItem(kind, id);
    if (!col || !canEdit(item)) return;
    toast('Duplicating…');

    let row = item._row ? Object.assign({}, item._row) : null;
    if (!row && writePath() === 'local') {
      row = Object.assign({}, localRows(col.table).filter((r) => String(r.id) === String(item.uuid))[0]);
    }
    if (!row && sb) {
      const { data, error } = await sb.from(col.table).select('*').eq('id', item.uuid).single();
      if (error || !data) return toast(writeError(error || new Error('not found')));
      row = data;
    }
    if (!row || !Object.keys(row).length) return toast('Could not read that row.');

    const copy = Object.assign({}, row);
    ['id', 'created_at', 'updated_at', 'created_by', 'updated_by'].forEach((k) => delete copy[k]);
    copy.position = maxPosition(kind) + 10;
    copy.is_active = false;                   // a copy starts hidden, so nothing surprises a visitor

    if (kind === 'service') {
      copy.title = row.title + ' (copy)';
      copy.block_title = (row.block_title || row.title) + ' (copy)';
      copy.slug = uniqueSlug(row.title + ' copy');
    } else {
      copy.code = nextCode(kind);
      copy.title = (row.title || '') + ' (copy)';
      if (kind === 'design') copy.is_featured = false;
    }

    const { error: ins } = await writeInsert(col.table, copy);
    if (ins) return toast(writeError(ins));
    await reloadContent(true);
    toast('Duplicated — the copy is hidden until you publish it');
  }

  /* ★ homepage slideshow */
  async function setFeatured(id, on) {
    const design = findDesign(id);
    if (!canEdit(design)) return;
    if (design.featured === on) return;

    const { error } = await writeUpdate('designs', design.uuid, { is_featured: !!on });
    if (error) return toast(writeError(error));
    design.featured = !!on;
    if (window.Site) window.Site.refresh();
    await reloadContent(true);
    toast(on ? 'Added to the homepage slideshow' : 'Removed from the homepage slideshow');
  }

  function writeError(err) {
    const e = err || {};
    const msg = String(e.message || e);
    if (/violates check constraint .*(title|name)_check/i.test(msg)) {
      return 'The online database still insists on a name for every item. Run the latest supabase/schema.sql once and photo-only items will publish.';
    }
    if (e.code === '42501' || /row-level security|new row violates/i.test(msg)) {
      return 'That change was refused online — your session may have expired. Sign out and sign in again.';
    }
    if (e.code === '23505' || /duplicate key/i.test(msg)) {
      return 'That reference (code or slug) already exists. Change it and save again.';
    }
    if (/Failed to fetch|NetworkError|fetch/i.test(msg)) return 'No connection right now — check the internet.';
    if (/column .*is_featured.* does not exist/i.test(msg)) {
      return 'The database does not have the slideshow column yet — paste the whole of supabase/schema.sql into the SQL Editor again; it adds the column in place.';
    }
    if (/column .*category.* does not exist|relation .*categories.* does not exist/i.test(msg)) {
      return 'The database does not have the categories table yet — paste the whole of supabase/schema.sql into the SQL Editor again; it creates the table in place.';
    }
    return msg;
  }

  /* ======================================================================
     8. PHOTO UPLOADS — three renditions, straight into the site-media bucket
     ====================================================================== */
  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { setTimeout(() => URL.revokeObjectURL(url), 4000); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
      img.src = url;
    });
  }

  function canvasBlob(img, maxW, quality) {
    return new Promise((resolve, reject) => {
      const nw = img.naturalWidth || img.width || maxW;
      const nh = img.naturalHeight || img.height || maxW;
      const scale = Math.min(1, maxW / nw);                 // never upscale
      const w = Math.max(1, Math.round(nw * scale));
      const h = Math.max(1, Math.round(nh * scale));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';                            // flatten transparency for JPEG
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      c.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode that image.'))), 'image/jpeg', quality);
    });
  }

  function uploadError(err) {
    const msg = String((err && err.message) || err || '');
    if (/row-level security|42501|policy/i.test(msg)) {
      return 'Supabase refused the upload — your admin session may have expired. Sign out and sign in again.';
    }
    if (/over the size limit|too large|413|quota|storage.*limit|exceeded/i.test(msg)) {
      return 'The website photo library is full or that file is over the 8 MB limit. Delete unused photos and try again.';
    }
    if (/mime|type/i.test(msg)) return 'That file type is not allowed — use JPG, PNG, WebP, AVIF or GIF.';
    if (/bucket not found/i.test(msg)) return 'The “site-media” bucket does not exist yet — run supabase/schema.sql §8.';
    return msg || 'Upload failed.';
  }

  async function uploadLocal(file, onStatus) {
    const up = cfg.upload || {};
    const maxBytes = up.maxBytes || 8 * 1024 * 1024;
    if (!isImageFile(file)) throw new Error('Choose a JPG, PNG, WebP or AVIF photo.');
    if (file.size > maxBytes) {
      throw new Error('That photo is ' + (file.size / 1048576).toFixed(1) + ' MB — the limit is ' +
        Math.round(maxBytes / 1048576) + ' MB.');
    }
    if (onStatus) onStatus('Preparing the photo…');
    const img = await loadImageFile(file);
    /* photos live in IndexedDB (not localStorage), so we can keep a full-size
       copy. It is re-cut into 1600/760/480 when the changes are published. */
    const blob = await canvasBlob(img, up.maxWidth || 1600, up.quality || 0.86);
    if (onStatus) onStatus('Saving the photo on this device…');
    if (!store || !store.putPhoto) {
      throw new Error('This browser cannot store photos locally. Sign in with the online account so they go to the website.');
    }
    const ref = await store.putPhoto(blob);
    const preview = store.resolveUrl ? await store.resolveUrl(ref) : '';
    return { full: ref, sm: '', xs: '', preview: preview };
  }

  async function uploadPhoto(folder, file, baseName, onStatus) {
    const live = writePath() === 'cloud' || await hasCloudSession();
    if (!live) return uploadLocal(file, onStatus);

    const up = cfg.upload || {};
    const widths = up.widths && up.widths.length ? up.widths : [1600, 760, 480];
    const maxBytes = up.maxBytes || 8 * 1024 * 1024;

    if (!isImageFile(file)) throw new Error('Choose a JPG, PNG, WebP or AVIF photo.');
    if (file.size > maxBytes) throw new Error('That photo is ' + (file.size / 1048576).toFixed(1) + ' MB — the limit is ' + Math.round(maxBytes / 1048576) + ' MB.');

    const img = await loadImageFile(file);
    const stem = (folder || 'misc') + '/' + (slugify(baseName) || 'photo') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const urls = {};

    for (let i = 0; i < widths.length; i++) {
      const w = widths[i];
      if (onStatus) onStatus('Resizing to ' + w + 'px…');
      const blob = await canvasBlob(img, w, up.quality || 0.86);
      const path = stem + '-' + w + '.jpg';
      if (onStatus) onStatus('Uploading ' + w + 'px…');
      const { error } = await sb.storage.from(cfg.mediaBucket).upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '31536000'
      });
      if (error) throw new Error(uploadError(error));
      urls[w] = sb.storage.from(cfg.mediaBucket).getPublicUrl(path).data.publicUrl;
    }

    return { full: urls[widths[0]], sm: urls[760] || '', xs: urls[480] || '', preview: urls[widths[0]] };
  }

  /* ======================================================================
     9. THE EDITOR DRAWER — the same page, one panel to the right
     ====================================================================== */
  function fieldId(key) { return 'af-' + key; }

  function pairRow(p) {
    p = p || {};
    return '<span class="admin-pair">' +
      '<input type="text" data-pk value="' + esc(p.k || '') + '" placeholder="Bold line, e.g. 18mm boards">' +
      '<input type="text" data-pv value="' + esc(p.v || '') + '" placeholder="Small line, e.g. Moisture-resistant">' +
      '<button class="admin-icon-btn" type="button" data-pair-remove aria-label="Remove this highlight">' + icon('x') + '</button>' +
      '</span>';
  }

  function imageFieldHtml(f, row) {
    const src = row[f.key] || '';
    const preview = row._preview || ((store && store.isMediaRef && store.isMediaRef(src)) ? '' : src);
    const variants = (f.variants || []).map((k) =>
      '<input type="hidden" data-fkey="' + k + '" value="' + esc(row[k] || '') + '">').join('');
    return [
      '<div class="admin-field admin-field--image" data-field="' + f.key + '">',
      '  <label>' + esc(f.label) + (f.required ? ' <em>*</em>' : '') + '</label>',
      '  <div class="admin-drop" data-drop tabindex="0" role="button" aria-label="Choose or drop a photo">',
      '    <img data-preview alt=""' + (preview ? ' src="' + esc(preview) + '"' : ' class="is-empty"') + '>',
      '    <span class="admin-drop__cta">' + icon('upload') +
             '<b>' + (src ? 'Replace photo' : 'Add a photo') + '</b>' +
             '<small>Drop it here or click to choose · JPG, PNG or WebP up to 8 MB</small></span>',
      '    <span class="admin-drop__busy" data-upload-status aria-live="polite"></span>',
      '  </div>',
      variants,
      '  <input type="file" accept="image/*" data-file hidden>',
      '  <span class="admin-urlrow">',
      '    <input type="text" data-fkey="' + f.key + '" value="' + esc(src) + '" placeholder="…or paste an image URL" spellcheck="false">',
      '    <button class="admin-chip admin-chip--danger" type="button" data-remove-photo>Remove</button>',
      '  </span>',
      (f.help ? '  <small>' + esc(f.help) + '</small>' : ''),
      '</div>'
    ].join('');
  }

  function pairsFieldHtml(f, row) {
    const list = Array.isArray(row[f.key]) ? row[f.key] : [];
    return [
      '<div class="admin-field admin-field--pairs" data-field="' + f.key + '">',
      '  <label>' + esc(f.label) + '</label>',
      '  <div class="admin-pairs" data-pairs="' + f.key + '">' + (list.length ? list.map(pairRow).join('') : '') + '</div>',
      '  <button class="admin-chip" type="button" data-pair-add="' + f.key + '">' + icon('plus') + ' Add a highlight</button>',
      (f.help ? '  <small>' + esc(f.help) + '</small>' : ''),
      '</div>'
    ].join('');
  }

  const optionsOf = (f) => (typeof f.options === 'function' ? f.options() : (f.options || []));

  function fieldHtml(f, row) {
    if (f.type === 'image') return imageFieldHtml(f, row);
    if (f.type === 'pairs') return pairsFieldHtml(f, row);

    const id = fieldId(f.key);
    const label = '<label for="' + id + '">' + esc(f.label) + (f.required ? ' <em>*</em>' : '') + '</label>';
    const help = f.help ? '<small>' + esc(f.help) + '</small>' : '';
    const v = row[f.key];

    if (f.type === 'toggle') {
      return '<div class="admin-field admin-field--toggle" data-field="' + f.key + '">' +
        '<span><b>' + esc(f.label) + '</b>' + (f.help ? '<small>' + esc(f.help) + '</small>' : '') + '</span>' +
        '<label class="admin-switch" for="' + id + '"><input id="' + id + '" type="checkbox" data-fkey="' + f.key + '"' +
        (v ? ' checked' : '') + '><i></i></label></div>';
    }
    if (f.type === 'number') {
      return '<div class="admin-field" data-field="' + f.key + '">' + label +
        '<input id="' + id + '" type="number" step="1" data-fkey="' + f.key + '" value="' + esc(v === null || v === undefined ? '' : v) + '">' + help + '</div>';
    }
    if (f.type === 'textarea') {
      return '<div class="admin-field" data-field="' + f.key + '">' + label +
        '<textarea id="' + id + '" rows="' + (f.rows || 3) + '" data-fkey="' + f.key + '" placeholder="' + esc(f.placeholder || '') + '">' +
        esc(v || '') + '</textarea>' + help + '</div>';
    }
    if (f.type === 'lines') {
      return '<div class="admin-field" data-field="' + f.key + '">' + label +
        '<textarea id="' + id + '" rows="4" data-fkey="' + f.key + '" placeholder="' + esc(f.placeholder || 'One line each') + '">' +
        esc((v || []).join('\n')) + '</textarea>' + help + '</div>';
    }
    if (f.type === 'select') {
      return '<div class="admin-field" data-field="' + f.key + '">' + label +
        '<select id="' + id + '" data-fkey="' + f.key + '">' +
        optionsOf(f).map((o) => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join('') +
        '</select>' + help + '</div>';
    }
    if (f.type === 'combo') {
      const dl = 'dl-' + f.key;
      const opts = optionsOf(f);
      return '<div class="admin-field" data-field="' + f.key + '">' + label +
        '<input id="' + id + '" type="text" list="' + dl + '" data-fkey="' + f.key + '" value="' + esc(v || '') + '" placeholder="' + esc(f.placeholder || '') + '">' +
        '<datalist id="' + dl + '">' + opts.map((o) => '<option value="' + esc(o) + '"></option>').join('') + '</datalist>' + help + '</div>';
    }
    /* text & slug */
    return '<div class="admin-field" data-field="' + f.key + '">' + label +
      '<input id="' + id + '" type="text" data-fkey="' + f.key + '" value="' + esc(v || '') + '" placeholder="' + esc(f.placeholder || '') + '"' +
      (f.type === 'slug' ? ' spellcheck="false" autocapitalize="none"' : '') + '>' + help + '</div>';
  }

  function formHtml(col, row) {
    const groups = [];
    col.fields.forEach((f) => { if (groups.indexOf(f.group) === -1) groups.push(f.group); });
    return groups.map((g) =>
      '<fieldset class="admin-group"><legend>' + esc(g) + '</legend>' +
      col.fields.filter((f) => f.group === g).map((f) => fieldHtml(f, row)).join('') +
      '</fieldset>').join('');
  }

  function defaultRow(kind) {
    const col = COLLECTIONS[kind];
    const row = {};
    col.fields.forEach((f) => {
      if (f.type === 'toggle') row[f.key] = f.default !== undefined ? f.default : true;
      else if (f.type === 'number') row[f.key] = maxPosition(kind) + 10;
      else if (f.type === 'lines' || f.type === 'pairs') row[f.key] = [];
      else row[f.key] = '';
      (f.variants || []).forEach((k) => { row[k] = ''; });
    });
    return row;
  }

  /* the online account looking at this device's unpublished draft: those
     changes must be published (or discarded) before editing continues, so an
     edit made now can never be hidden behind the draft */
  function draftBlocks() {
    const sc = window.SiteContent || {};
    if (writePath() !== 'cloud' || sc.source !== 'local') return false;
    offerPublish('edit');
    return true;
  }

  async function openEditor(kind, id) {
    const col = COLLECTIONS[kind];
    if (!col) return;
    if (!writePath()) {
      toast('Editing is unavailable — see the message in the bar.');
      openBar();
      return;
    }
    if (draftBlocks()) return;

    const item = id ? findItem(kind, id) : null;
    if (id && !canEdit(item)) { toast('That block is not in the database yet.'); return; }

    ensureShell();
    const row = item && item._row ? Object.assign({}, item._row)
      : (item && writePath() === 'local'
        ? Object.assign({}, localRows(col.table).filter((r) => String(r.id) === String(item.uuid))[0] || {})
        : defaultRow(kind));
    if (store && store.resolveUrl && row.image_url) {
      try { row._preview = await store.resolveUrl(row.image_url); } catch (e) { row._preview = ''; }
    }

    state.editing = { kind: kind, uuid: item ? item.uuid : null, item: item || {} };
    state.dirty = false;
    if (window.SiteContent) window.SiteContent.paused = true;   // no realtime reload while typing

    $('[data-editor-where]', shell).innerHTML = icon('pencil') + ' ' + esc(col.plural);
    $('[data-editor-title]', shell).textContent = (item ? 'Edit ' : 'New ') + col.label.toLowerCase();
    $('[data-editor-error]', shell).textContent = '';
    $('[data-editor-body]', shell).innerHTML = formHtml(col, row);
    $('[data-editor-body]', shell).scrollTop = 0;
    $('[data-editor-delete]', shell).style.display = item ? '' : 'none';
    $('[data-editor-save] span', shell).textContent = item ? 'Save changes' : 'Create and publish';

    $('[data-admin-drawer]', shell).classList.add('is-open');
    $('[data-admin-drawer]', shell).setAttribute('aria-hidden', 'false');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    document.body.classList.add('admin-no-scroll');

    wireForm(col);
  }

  function closeEditor(silent) {
    if (!shell) return;
    $('[data-admin-drawer]', shell).classList.remove('is-open');
    $('[data-admin-drawer]', shell).setAttribute('aria-hidden', 'true');
    if (!$('[data-admin-login]', shell).classList.contains('is-open') && !state.panel) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
    state.editing = null;
    if (!silent) state.dirty = false;
    if (window.SiteContent) window.SiteContent.paused = false;
  }

  function showEditorError(msg) {
    if (!shell) return;
    const el = $('[data-editor-error]', shell);
    el.textContent = msg || '';
    el.classList.toggle('is-on', !!msg);
  }

  function wireForm(col) {
    const body = $('[data-editor-body]', shell);

    body.addEventListener('input', () => { state.dirty = true; });
    body.addEventListener('change', () => { state.dirty = true; });

    /* pairs ------------------------------------------------------------- */
    body.addEventListener('click', (e) => {
      const add = e.target.closest('[data-pair-add]');
      if (add) {
        const wrap = $('[data-pairs="' + add.dataset.pairAdd + '"]', body);
        if (wrap) wrap.insertAdjacentHTML('beforeend', pairRow({}));
        state.dirty = true;
        return;
      }
      const rm = e.target.closest('[data-pair-remove]');
      if (rm) { const row = rm.closest('.admin-pair'); if (row) row.remove(); state.dirty = true; }
    });

    /* slug follows the title on new services ---------------------------- */
    const slugEl = $('[data-fkey="slug"]', body);
    const titleEl = $('[data-fkey="title"]', body);
    if (slugEl && titleEl && !state.editing.uuid) {
      let touched = false;
      slugEl.addEventListener('input', () => { touched = true; });
      titleEl.addEventListener('input', () => { if (!touched) slugEl.value = slugify(titleEl.value); });
    }

    /* photos ------------------------------------------------------------- */
    $$('.admin-field--image', body).forEach((fieldEl) => {
      const key = fieldEl.dataset.field;
      const f = col.fields.filter((x) => x.key === key)[0];
      if (f) wireImageField(fieldEl, f, col);
    });
  }

  function wireImageField(fieldEl, f, col) {
    const drop = $('[data-drop]', fieldEl);
    const fileInput = $('[data-file]', fieldEl);
    const urlInput = $('[data-fkey="' + f.key + '"]', fieldEl);
    const preview = $('[data-preview]', fieldEl);
    const status = $('[data-upload-status]', fieldEl);
    const removeBtn = $('[data-remove-photo]', fieldEl);
    const variantInputs = (f.variants || []).map((k) => $('[data-fkey="' + k + '"]', fieldEl));

    const setPreview = (src) => {
      if (src) { preview.src = src; preview.classList.remove('is-empty'); }
      else { preview.removeAttribute('src'); preview.classList.add('is-empty'); }
      drop.classList.toggle('has-photo', !!src);
      const cta = $('.admin-drop__cta b', drop);
      if (cta) cta.textContent = src ? 'Replace photo' : 'Add a photo';
    };

    const nameHint = () => {
      const body = $('[data-editor-body]', shell);
      const t = $('[data-fkey="title"]', body) || $('[data-fkey="name"]', body) || $('[data-fkey="label"]', body);
      return (t && t.value) || col.folder;
    };

    const useFile = async (file) => {
      drop.classList.add('is-busy');
      try {
        const res = await uploadPhoto(col.folder, file, nameHint(), (m) => { status.textContent = m; });
        urlInput.value = res.full;
        if (variantInputs[0]) variantInputs[0].value = res.sm;
        if (variantInputs[1]) variantInputs[1].value = res.xs;
        setPreview(res.preview || res.full);
        status.textContent = '';
        state.dirty = true;
        toast(writePath() === 'local'
          ? 'Photo ready on this device — remember to save. Publish to the website so other devices can see it.'
          : 'Photo uploaded — remember to save');
      } catch (err) {
        status.textContent = '';
        toast(err.message || 'Upload failed');
      }
      drop.classList.remove('is-busy');
    };

    drop.addEventListener('click', (e) => { if (!drop.classList.contains('is-busy')) { e.preventDefault(); fileInput.click(); } });
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) useFile(file);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) useFile(fileInput.files[0]);
      fileInput.value = '';
    });
    urlInput.addEventListener('input', () => {
      variantInputs.forEach((v) => { if (v) v.value = ''; });   // a pasted URL has no renditions
      setPreview(urlInput.value.trim());
    });
    removeBtn.addEventListener('click', () => {
      urlInput.value = '';
      variantInputs.forEach((v) => { if (v) v.value = ''; });
      setPreview('');
      state.dirty = true;
    });
  }

  function readPairs(body, key) {
    const wrap = $('[data-pairs="' + key + '"]', body);
    if (!wrap) return [];
    return $$('.admin-pair', wrap).map((r) => {
      const k = $('[data-pk]', r);
      const v = $('[data-pv]', r);
      return { k: k ? k.value.trim() : '', v: v ? v.value.trim() : '' };
    }).filter((p) => p.k || p.v);
  }

  function readForm(col) {
    const body = $('[data-editor-body]', shell);
    const row = {};
    col.fields.forEach((f) => {
      if (f.type === 'pairs') { row[f.key] = readPairs(body, f.key); return; }
      const el = $('[data-fkey="' + f.key + '"]', body);
      if (!el) return;
      if (f.type === 'toggle') { row[f.key] = !!el.checked; return; }
      if (f.type === 'number') { row[f.key] = el.value === '' ? 0 : (parseInt(el.value, 10) || 0); return; }
      if (f.type === 'lines') {
        row[f.key] = el.value.split('\n').map((s) => s.trim()).filter(Boolean);
        return;
      }
      row[f.key] = String(el.value || '').trim();
      (f.variants || []).forEach((k) => {
        const v = $('[data-fkey="' + k + '"]', body);
        row[k] = v ? String(v.value || '').trim() : '';
      });
    });
    return row;
  }

  function buildPayload(kind, row, ed) {
    const col = COLLECTIONS[kind];
    const payload = Object.assign({}, row);

    /* every column the table expects must be present */
    col.fields.forEach((f) => {
      if (!(f.key in payload)) {
        payload[f.key] = f.type === 'toggle' ? (f.default !== undefined ? f.default : true) : f.type === 'number' ? 0
          : (f.type === 'lines' || f.type === 'pairs') ? [] : '';
      }
      (f.variants || []).forEach((k) => { if (!(k in payload)) payload[k] = ''; });
    });

    if (kind === 'service') {
      payload.slug = slugify(payload.slug || payload.title);
      if (!payload.slug) payload.slug = uniqueSlug(payload.title);
      if (!payload.block_title) payload.block_title = payload.title;
    }
    if (!payload.image_url) { payload.image_url_760 = ''; payload.image_url_480 = ''; }

    /* the built-in account has no auth.users row to point at */
    payload.updated_by = state.admin && state.admin.id ? state.admin.id : null;
    if (!ed.uuid) {
      payload.created_by = state.admin && state.admin.id ? state.admin.id : null;
      if (kind !== 'service') payload.code = nextCode(kind);
      payload.position = Number(payload.position) || (maxPosition(kind) + 10);
    }
    if (writePath() === 'local') {
      /* keep the browser-only rows free of columns a cloud table would own */
      delete payload.updated_by;
      delete payload.created_by;
    }
    return payload;
  }

  async function saveEditor() {
    const ed = state.editing;
    if (!ed) return;
    const col = COLLECTIONS[ed.kind];
    const row = readForm(col);

    /* --- validation ---------------------------------------------------- */
    const missing = col.fields.filter((f) => f.required && !String(row[f.key] || '').trim());
    if (missing.length) {
      showEditorError('Please fill in: ' + missing.map((f) => f.label).join(', ') + '.');
      const first = $('[data-fkey="' + missing[0].key + '"]', shell);
      if (first) first.focus();
      return;
    }
    if (ed.kind === 'service') {
      const slug = slugify(row.slug || row.title);
      if (!slug) { showEditorError('A service needs a title (the slug is built from it).'); return; }
      const clash = (col.list() || []).some((s) => s.slug === slug && String(s.uuid) !== String(ed.uuid || ''));
      if (clash) { showEditorError('Another service already uses the slug “' + slug + '”.'); return; }
    }
    showEditorError('');

    const saveBtn = $('[data-editor-save]', shell);
    saveBtn.disabled = true;
    const label = saveBtn.querySelector('span').textContent;
    saveBtn.querySelector('span').textContent = 'Saving…';

    try {
      const payload = buildPayload(ed.kind, row, ed);
      const res = ed.uuid
        ? await writeUpdate(col.table, ed.uuid, payload)
        : await writeInsert(col.table, payload);
      if (res.error) throw res.error;

      state.dirty = false;
      closeEditor(true);
      await reloadContent(true);
      toast(ed.uuid ? col.label + ' saved' : col.label + ' created and published');
    } catch (err) {
      showEditorError(writeError(err));
      toast('Could not save — see the message in the panel');
    } finally {
      saveBtn.disabled = false;
      const span = saveBtn.querySelector('span');
      if (span) span.textContent = label;
    }
  }

  /* ======================================================================
     9b. UPLOAD MANY PHOTOS — every picked photo becomes its own item
     ====================================================================== */
  const bulk = { kind: 'design', files: [], busy: false };

  function setBulkWarn(on, text) {
    const warn = $('[data-bulk-warn]', shell);
    if (!warn) return;
    if (!on) { warn.hidden = true; warn.textContent = ''; return; }
    warn.hidden = false;
    warn.textContent = text || '';
  }

  async function openBulk(kind) {
    const col = COLLECTIONS[kind];
    if (!col || !col.bulk) return;
    if (!writePath()) { toast('Uploading is unavailable — see the message in the bar.'); openBar(); return; }
    if (draftBlocks()) return;
    ensureShell();
    bulk.kind = kind; bulk.files = []; bulk.busy = false;

    /* if the online account exists, switch to it so these photos go live */
    if (writePath() !== 'cloud') {
      const live = await ensureCloudWrites();
      if (live) toast('Connected to the website — these photos will appear on every device.');
    }

    const live = writePath() === 'cloud';
    $('[data-bulk-kind]', shell).textContent = col.plural;
    $('[data-bulk-lead]', shell).textContent = live
      ? 'Every photo you pick becomes a new ' + col.label.toLowerCase() +
        ' on the website straight away — photo and “Request quotation” button only. Open any of them afterwards with ✎ to add a name and details. You can pick as many as you like.'
      : 'Every photo you pick becomes a new ' + col.label.toLowerCase() +
        ' on this device. They will not appear on other phones or computers until you publish them to the website.';
    setBulkWarn(!live, 'These photos stay on this device only. Sign in with the online account (the same phone number, after it has been created in Supabase) and tap “Publish to the website” so every device sees them.');

    const sel = $('[data-bulk-cat]', shell);
    const cats = categoryOptions(kind);
    sel.innerHTML = '<option value="">No category yet (shows under “All”)</option>' +
      cats.map((c) => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('');
    /* the chip the admin is looking at is the most likely answer */
    const activeChip = document.querySelector('[data-filter-kind="' + kind + '"] .filter.is-active');
    if (activeChip && cats.indexOf(activeChip.dataset.filter) !== -1) sel.value = activeChip.dataset.filter;

    renderBulkList();
    $('[data-bulk-status]', shell).textContent = '';
    openPanel('bulk');
  }

  function renderBulkList() {
    const list = $('[data-bulk-list]', shell);
    const start = $('[data-bulk-start]', shell);
    list.innerHTML = bulk.files.map((f, i) =>
      '<li class="admin-bulk__item' + (f.state ? ' is-' + f.state : '') + '" data-bulk-i="' + i + '">' +
      '<img src="' + esc(f.preview) + '" alt="">' +
      '<span class="admin-bulk__name">' + esc(f.file.name) + '<small>' + (f.file.size / 1048576).toFixed(1) + ' MB' +
      (f.note ? ' · ' + esc(f.note) : '') + '</small></span>' +
      (bulk.busy ? '' : '<button class="admin-icon-btn" type="button" data-bulk-remove="' + i + '" aria-label="Remove">' + icon('x') + '</button>') +
      '</li>').join('');
    start.disabled = bulk.busy || !bulk.files.some((f) => !f.state || f.state === 'error');
    const n = bulk.files.filter((f) => !f.state || f.state === 'error').length;
    $('span', start).textContent = n ? 'Upload ' + n + ' photo' + (n === 1 ? '' : 's') : 'Upload';
  }

  function addBulkFiles(fileList) {
    const up = cfg.upload || {};
    const maxBytes = up.maxBytes || 8 * 1024 * 1024;
    Array.prototype.forEach.call(fileList || [], (file) => {
      if (!isImageFile(file)) return;
      const entry = { file: file, preview: URL.createObjectURL(file), state: '', note: '' };
      if (file.size > maxBytes) { entry.state = 'error'; entry.note = 'bigger than ' + Math.round(maxBytes / 1048576) + ' MB — it will be skipped'; entry.skip = true; }
      bulk.files.push(entry);
    });
    renderBulkList();
  }

  function wireBulk() {
    const drop = $('[data-bulk-drop]', shell);
    const input = $('[data-bulk-files]', shell);
    drop.addEventListener('click', () => { if (!bulk.busy) input.click(); });
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!bulk.busy) input.click(); } });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-over'); if (!bulk.busy && e.dataTransfer) addBulkFiles(e.dataTransfer.files); });
    input.addEventListener('change', () => { addBulkFiles(input.files); input.value = ''; });
    $('[data-bulk-list]', shell).addEventListener('click', (e) => {
      const rm = e.target.closest('[data-bulk-remove]');
      if (!rm || bulk.busy) return;
      const i = parseInt(rm.dataset.bulkRemove, 10);
      if (bulk.files[i]) { URL.revokeObjectURL(bulk.files[i].preview); bulk.files.splice(i, 1); renderBulkList(); }
    });
    $('[data-bulk-start]', shell).addEventListener('click', runBulk);
  }

  function bulkPayload(kind, category, code, position, res) {
    return kind === 'design'
      ? { code: code, title: '', category: category, image_url: res.full, image_url_760: res.sm, image_url_480: res.xs,
          image_alt: '', badge: '', lead_time: '', unit: '', summary: '', features: [], materials: [],
          is_featured: false, position: position, is_active: true }
      : { code: code, name: '', category: category, image_url: res.full, image_url_760: res.sm, image_url_480: res.xs,
          image_alt: '', swatch: 'mdf', icon: 'box', unit: '', badge: '', note: '', position: position, is_active: true };
  }

  async function runBulk() {
    if (bulk.busy) return;
    const kind = bulk.kind;
    const col = COLLECTIONS[kind];
    const category = $('[data-bulk-cat]', shell).value || '';
    const status = $('[data-bulk-status]', shell);
    const todo = bulk.files.filter((f) => (!f.state || f.state === 'error') && !f.skip);
    if (!todo.length) return;

    /* last chance to put these photos on the live website */
    if (writePath() !== 'cloud') await ensureCloudWrites();
    const live = writePath() === 'cloud';
    setBulkWarn(!live, 'These photos stay on this device only. Other phones and computers will not see them until you publish them to the website.');

    bulk.busy = true;
    renderBulkList();
    const nextCodeFn = codeAllocator(kind);
    let position = maxPosition(kind);
    const jobs = todo.map((f) => {
      position += 10;
      return { f: f, code: nextCodeFn(), position: position };
    });
    let ok = 0, failed = 0, done = 0;
    const uid = state.admin && state.admin.id ? state.admin.id : null;
    const tick = () => {
      status.textContent = 'Photo ' + Math.min(done + 1, jobs.length) + ' of ' + jobs.length +
        (ok || failed ? ' · ' + ok + ' added' + (failed ? ', ' + failed + ' failed' : '') : '') + '…';
      renderBulkList();
    };

    const work = async (job) => {
      const f = job.f;
      f.state = 'busy'; f.note = 'uploading…'; tick();
      try {
        const stem = f.file.name.replace(/\.[^.]+$/, '');
        const res = await uploadPhoto(col.folder, f.file, stem, (m) => { f.note = m; });
        const payload = bulkPayload(kind, category, job.code, job.position, res);
        if (live) { payload.created_by = uid; payload.updated_by = uid; }
        const { error } = await writeInsert(col.table, payload);
        if (error) throw error;
        f.state = 'done';
        f.note = live ? 'on the website' : 'saved on this device';
        ok += 1;
      } catch (err) {
        f.state = 'error'; f.note = writeError(err) || uploadError(err);
        failed += 1;
      }
      done += 1;
      tick();
    };

    /* a few at a time so a hundred photos finish in minutes, not one-by-one */
    await mapPool(jobs, live ? 3 : 1, work);

    bulk.busy = false;
    renderBulkList();
    status.textContent = ok + ' added' + (failed ? ' · ' + failed + ' failed — tap Upload to retry those' : '') +
      (ok && !live ? ' · still only on this device until you publish' : '');
    await reloadContent(true);
    if (ok && live) toast(ok + ' photo' + (ok === 1 ? '' : 's') + ' added to the website — open any with ✎ to add a name');
    else if (ok) toast(ok + ' photo' + (ok === 1 ? '' : 's') + ' saved on this device only. Publish to the website so other devices can see them.', 'warn');
    else toast('Nothing was added');
    if (!failed && live) setTimeout(() => { if (!bulk.busy) closePanels(); }, 900);
  }

  /* ======================================================================
     10. HOMEPAGE SLIDESHOW PANEL — every Designs Gallery photo, one tick each
     --------------------------------------------------------------------------
     The panel lists ALL the designs in the gallery, in gallery order. The
     photos that currently rotate on the home page are ticked, every other
     photo is unticked. Tapping a photo only stages the choice — nothing is
     written until "Save". After saving, the home page slideshow shows
     exactly the ticked photos, so the five (or however many) the
     administrator selected are the five that visitors see.
     ====================================================================== */
  let slidesSel = null;      // staged selection — a Set of design uuids
  let slidesDirty = false;   // does the staged selection differ from what is saved?

  /* the Designs Gallery order — position, same order the page shows them */
  function slideOrder() {
    return (window.Site ? window.Site.lists.designs() : []).slice()
      .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
  }

  function slidesSyncControls() {
    const save = $('[data-slides-save]', shell);
    const count = $('[data-slides-count]', shell);
    if (save) save.disabled = !slidesSel || !slidesDirty;
    if (count) {
      const n = slidesSel ? slidesSel.size : 0;
      count.textContent = n + ' selected for the home page';
    }
  }

  function updateSlidesStatus(saved) {
    const status = $('[data-slides-status]', shell);
    if (!status) return;
    const n = slidesSel ? slidesSel.size : 0;
    if (saved) {
      status.innerHTML = (n ? icon('check') : icon('alert')) + ' <b>' + n + '</b> photo' +
        (n === 1 ? '' : 's') + ' now rotate on the home page, in the order above.';
      return;
    }
    status.innerHTML = n
      ? '<b>' + n + '</b> photo' + (n === 1 ? '' : 's') + ' will rotate on the home page, in the order above. ' +
        'Press <b>Save slideshow</b> to update the home page.'
      : '<span class="admin-slide-warn">' + icon('alert') +
        ' Nothing is ticked — the home page would have no slideshow photos.</span>';
  }

  function renderSlidesPanel() {
    ensureShell();
    const body = $('[data-slides-body]', shell);
    const designs = slideOrder();

    if (!designs.length) {
      slidesSel = null;
      slidesDirty = false;
      body.innerHTML = '<p class="admin-empty">No designs yet. Add one on the Designs page and it will appear here.</p>';
      const status = $('[data-slides-status]', shell);
      if (status) status.textContent = '';
      slidesSyncControls();
      return;
    }

    /* the staged selection starts from what the home page shows right now:
       the ticked photos stay ticked, every other gallery photo starts off */
    slidesSel = new Set();
    designs.forEach((d) => { if (d.featured === true) slidesSel.add(String(d.uuid || d.id)); });
    slidesDirty = false;

    body.innerHTML = designs.map((d) => {
      const on = slidesSel.has(String(d.uuid || d.id));
      const hidden = d.active === false;
      return '<label class="admin-slide' + (on ? ' is-on' : '') + (hidden ? ' is-draft' : '') + '">' +
        '<input type="checkbox" data-slide-id="' + esc(String(d.uuid || d.id)) + '"' + (on ? ' checked' : '') + '>' +
        '<span class="admin-slide__thumb">' +
          (d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy">' : '<i>' + icon('starOutline') + '</i>') +
        '</span>' +
        '<span class="admin-slide__text"><b>' + esc(d.title || 'Design (no name yet)') + '</b>' +
          '<small>' + esc(d.category || 'No category') +
          (hidden ? ' · hidden from visitors' : '') +
          (!d.image ? ' · no photo yet' : '') +
          (on ? ' · in the slideshow' : '') + '</small></span>' +
        '</label>';
    }).join('');

    updateSlidesStatus(false);
    slidesSyncControls();
  }

  /* a tap on a photo: stage it, redraw the tick states, keep the Save button
     honest — no database write yet */
  function slidesToggle(id, on) {
    if (!slidesSel) return;
    if (on) slidesSel.add(String(id)); else slidesSel.delete(String(id));
    const body = $('[data-slides-body]', shell);
    $$('[data-slide-id]', body).forEach((box) => {
      const row = box.closest('.admin-slide');
      if (row) row.classList.toggle('is-on', box.checked);
    });
    slidesDirty = true;
    updateSlidesStatus(false);
    slidesSyncControls();
  }

  /* Save — write every design whose tick changed, then refresh the page so
     the hero instantly plays exactly the ticked photos */
  async function saveSlides() {
    if (!slidesSel || !slidesDirty) return;
    if (draftBlocks()) return;
    const saveBtn = $('[data-slides-save]', shell);
    if (saveBtn) saveBtn.disabled = true;

    const changed = slideOrder().filter((d) =>
      !!(d.uuid) && slidesSel.has(String(d.uuid)) !== (d.featured === true));
    try {
      for (let i = 0; i < changed.length; i++) {
        const d = changed[i];
        const on = slidesSel.has(String(d.uuid));
        const { error } = await writeUpdate('designs', d.uuid, { is_featured: !!on });
        if (error) throw error;
        d.featured = !!on;                  // keep the in-memory list in step
      }
      slidesDirty = false;
      if (window.Site) window.Site.refresh();
      updateSlidesStatus(true);
      slidesSyncControls();
      const n = slidesSel.size;
      toast('Slideshow updated — ' + n + ' photo' + (n === 1 ? '' : 's') + ' now on the home page');
    } catch (err) {
      toast(writeError(err));
      updateSlidesStatus(false);
    } finally {
      slidesSyncControls();
    }
  }

  /* ======================================================================
     11. CATEGORIES PANEL — add · rename · reorder · hide · delete
     ====================================================================== */
  const catTable = () => COLLECTIONS.category.table;

  function catRows(kind) {
    let rows = [];
    if (writePath() === 'local') {
      rows = localRows(catTable()).filter((r) => r.kind === kind);
    } else if (window.SiteContent && window.SiteContent.categoryList) {
      /* the site already holds the mapped rows for every signed-in admin */
      rows = window.SiteContent.categoryList(kind).map((c) => c._row).filter(Boolean);
    }
    return rows.slice().sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0) ||
      String(a.name || '').localeCompare(String(b.name || '')));
  }

  function countIn(kind, name) {
    const list = kind === 'service'
      ? (window.Site ? window.Site.lists.services() : [])
      : kind === 'design'
        ? (window.Site ? window.Site.lists.designs() : [])
        : (window.Site ? window.Site.lists.materials() : []);
    return list.filter((x) => (x.category || '') === name).length;
  }

  function showCatTab(kind, silent) {
    state.catsKind = CAT_KINDS.indexOf(kind) === -1 ? 'design' : kind;
    ensureShell();
    $$('[data-cats-tab]', shell).forEach((t) => {
      const on = t.dataset.catsTab === state.catsKind;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    $('[data-cats-lead]', shell).innerHTML = 'These are the chips above the ' +
      (state.catsKind === 'design' ? 'Designs' : state.catsKind === 'material' ? 'Materials' : 'Services') +
      ' grid. Renaming one renames it on every item using it; hiding one keeps the items but drops the chip.';
    renderCatPanel();
    if (!silent) $('[data-cats-new]', shell).focus();
  }

  function renderCatPanel() {
    if (!shell) return;
    const kind = state.catsKind;
    const body = $('[data-cats-body]', shell);
    const rows = catRows(kind);

    if (!rows.length) {
      body.innerHTML = '<p class="admin-empty">No categories yet — add the first one below.</p>';
      return;
    }

    body.innerHTML = rows.map((r, i) => {
      const n = countIn(kind, r.name);
      const off = r.is_active === false;
      return '<div class="admin-cat' + (off ? ' is-off' : '') + '" data-cat-id="' + esc(String(r.id)) + '"' +
        ' data-cat-name="' + esc(String(r.name)) + '">' +
        '<span class="admin-cat__grip" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<input class="admin-cat__name" type="text" data-cat-name-input value="' + esc(String(r.name)) + '"' +
          ' aria-label="Category name" spellcheck="false">' +
        '<span class="admin-cat__count">' + n + '</span>' +
        '<span class="admin-cat__tools">' +
          '<button class="admin-tool" type="button" data-cat-move="-1" title="Move up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
          '<button class="admin-tool" type="button" data-cat-move="1" title="Move down" aria-label="Move down"' + (i === rows.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
          '<button class="admin-tool' + (off ? ' is-off' : '') + '" type="button" data-cat-toggle title="' +
            (off ? 'Show this chip in the filters' : 'Hide this chip from visitors') + '" aria-label="Show or hide">' +
            icon(off ? 'eyeOff' : 'eye') + '</button>' +
          '<button class="admin-tool admin-tool--danger" type="button" data-cat-delete title="Delete" aria-label="Delete">' + icon('trash') + '</button>' +
        '</span>' +
        '</div>';
    }).join('');
  }

  async function renameCategory(id, before, after) {
    const kind = state.catsKind;
    const patch = { name: after, slug: slugify(after) };
    const { error } = await writeUpdate(catTable(), id, patch);
    if (error) { toast(writeError(error)); renderCatPanel(); return; }

    /* every item that used the old name follows the category */
    const itemTable = COLLECTIONS[kind].table;
    const moved = await writeUpdateWhere(itemTable, { category: before }, { category: after });
    if (moved.error) toast(writeError(moved.error));

    await reloadContent(true);
    toast('“' + before + '” is now “' + after + '”');
  }

  async function addCategory(kind, name) {
    const clean = String(name || '').trim();
    if (!clean) { toast('Type a name for the new category first'); return false; }
    if (catRows(kind).some((r) => String(r.name).toLowerCase() === clean.toLowerCase())) {
      toast('“' + clean + '” is already in this list');
      return false;
    }
    const positions = catRows(kind).map((r) => Number(r.position) || 0);
    const payload = {
      kind: kind,
      name: clean,
      slug: slugify(clean),
      position: (positions.length ? Math.max.apply(null, positions) : 0) + 10,
      is_active: true
    };
    if (writePath() !== 'local') { payload.created_by = state.admin && state.admin.id ? state.admin.id : null; }

    const { error } = await writeInsert(catTable(), payload);
    if (error) { toast(writeError(error)); return false; }
    await reloadContent(true);
    toast('Category added to the ' + KIND_LABEL[kind].toLowerCase() + ' filters');
    return true;
  }

  async function moveCategory(id, dir) {
    const kind = state.catsKind;
    const rows = catRows(kind);
    const from = rows.findIndex((r) => String(r.id) === String(id));
    const to = from + dir;
    if (from < 0 || to < 0 || to >= rows.length) return;
    rows.splice(to, 0, rows.splice(from, 1)[0]);

    if (writePath() === 'local') {
      store.reorder(catTable(), rows.map((r) => r.id));
      await reloadContent(true);
      return;
    }
    try {
      await Promise.all(rows.map((r, i) => sb.from(catTable()).update({ position: (i + 1) * 10 }).eq('id', r.id)));
      await reloadContent(true);
    } catch (err) { toast(writeError(err)); }
  }

  async function toggleCategory(id) {
    const row = catRows(state.catsKind).filter((r) => String(r.id) === String(id))[0];
    if (!row) return;
    const next = row.is_active === false;
    const { error } = await writeUpdate(catTable(), id, { is_active: next });
    if (error) return toast(writeError(error));
    await reloadContent(true);
    toast(next ? 'Chip shown in the filters again' : 'Chip hidden from visitors — the items stay where they are');
  }

  async function deleteCategory(id, name) {
    const n = countIn(state.catsKind, name);
    const ok = await confirmDialog({
      title: 'Delete the category “' + name + '”?',
      text: n
        ? n + ' item' + (n === 1 ? '' : 's') + ' still use this label. They keep the label and stay visible under “All”, but they lose their own chip.'
        : 'Nothing uses this category right now.',
      yesLabel: 'Delete',
      danger: true
    });
    if (!ok) return;

    const { error } = await writeDelete(catTable(), id);
    if (error) return toast(writeError(error));
    await reloadContent(true);
    toast('Category deleted');
  }

  /* ======================================================================
     12. WIRING & PUBLIC API
     ====================================================================== */
  /* keep the toolbars in step with every re-render of the page */
  document.addEventListener('site:rendered', () => {
    if (!state.active) return;
    undecorate();
    decorate();
  });
  document.addEventListener('site:content', () => {
    updateBar();
    if (state.active) { undecorate(); decorate(); }
  });
  /* a remembered sign-in can be restored before the page itself has drawn
     its grids — once the site is ready, draw the toolbars over them */
  document.addEventListener('site:ready', () => {
    if (!state.active) return;
    if (window.Site) window.Site.setShowHidden(true);
    undecorate();
    decorate();
    updateBar();
  });

  window.SiteAdmin = {
    openLogin: openLogin,
    openBar: openBar,
    openDock: openBar,                 // older name, kept for js/ghost.js
    openPanel: openPanel,
    resume: resume,
    signOut: signOut,
    isActive: () => state.active,
    isSignedIn: () => !!state.admin,
    decorate: decorate,
    undecorate: undecorate,
    reload: reloadContent,
    state: state
  };
})();
