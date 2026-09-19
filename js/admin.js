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
      title: (r) => r.title || 'Untitled design',
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', required: true, group: 'Photo',
          variants: ['image_url_760', 'image_url_480'],
          help: 'This is also the picture shown in the homepage slideshow when the design is ticked below (about 1376 × 900 looks best).' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo',
          help: 'Leave blank to use “<Title> — <Category> by Redefine Interiors”.' },
        { key: 'is_featured', label: 'Show in the homepage slideshow', type: 'toggle', group: 'Homepage slideshow',
          default: false, help: 'Tick to rotate this photo on the home page. The slideshow plays the ticked designs in the order of the Designs page.' },
        { key: 'title', label: 'Title', type: 'text', required: true, group: 'Text under the photo',
          placeholder: 'Modern L-Shaped Kitchen Cabinets' },
        { key: 'summary', label: 'Summary', type: 'textarea', group: 'Text under the photo',
          help: 'Two or three sentences. This is the paragraph visitors read on the card and in the detail pop-up.' },
        { key: 'features', label: 'What is included', type: 'lines', group: 'Text under the photo',
          help: 'One line each. The first three appear as chips on the card; all of them in the detail pop-up.' },
        { key: 'materials', label: 'Materials used', type: 'lines', group: 'Text under the photo', help: 'One line each.' },
        { key: 'category', label: 'Category', type: 'combo', options: () => categoryOptions('design'), group: 'Card details',
          help: 'Drives the filters on the Designs page. Add a new one in the bar above → Categories.' },
        { key: 'badge', label: 'Badge', type: 'text', group: 'Card details', placeholder: 'Best seller',
          help: 'Small corner label. Leave blank for none.' },
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
      title: (r) => r.name || 'Untitled material',
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', group: 'Photo',
          variants: ['image_url_760', 'image_url_480'],
          help: 'Optional. Without a photo the card shows the designed swatch below instead.' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo' },
        { key: 'name', label: 'Name', type: 'text', required: true, group: 'Text under the photo',
          placeholder: '18mm MDF Board' },
        { key: 'note', label: 'Note', type: 'textarea', group: 'Text under the photo',
          help: 'The paragraph under the name — grades, colours, bulk discounts, what is included.' },
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
      '        <input id="admin-id" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="0703142874" required>',
      '      </div>',
      '      <div class="field">',
      '        <label for="admin-pw">Password</label>',
      '        <span class="admin-pw">',
      '          <input id="admin-pw" type="password" autocomplete="current-password" placeholder="••••••••" required>',
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

      /* ---- homepage slideshow ----------------------------------------- */
      '<div class="admin-modal" data-admin-slides role="dialog" aria-modal="true" aria-label="Homepage slideshow" aria-hidden="true">',
      '  <div class="admin-modal__panel">',
      '    <div class="admin-modal__head">',
      '      <div>',
      '        <span class="admin-eyebrow">' + icon('star') + ' Home page</span>',
      '        <h3>Homepage slideshow</h3>',
      '      </div>',
      '      <button class="admin-x" type="button" data-slides-close aria-label="Close">' + icon('x') + '</button>',
      '    </div>',
      '    <p class="admin-modal__lead">Tick the design photos that rotate in the home-page frame. ',
      '      They are the same pictures as the Designs page, so a photo you replace there is replaced here too.</p>',
      '    <div class="admin-modal__body" data-slides-body></div>',
      '    <p class="admin-modal__status" data-slides-status></p>',
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

    if (BUILTIN && BUILTIN.prefilled) {
      $('#admin-id', shell).value = BUILTIN.phone;
      $('#admin-pw', shell).value = fromB64(BUILTIN.passwordB64);
    }
    $('[data-login-foot]', shell).innerHTML = BUILTIN
      ? 'The built-in account is <b>' + esc(BUILTIN.phone) + '</b>. Other administrators sign in with the phone number or e-mail of their Supabase account.'
      : 'Accounts live in Supabase → Authentication → Users. The first account you create becomes the owner.';

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

    $('[data-slides-close]', shell).addEventListener('click', closePanels);
    $('[data-cats-close]', shell).addEventListener('click', closePanels);

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

    /* slideshow: tick / untick */
    $('[data-slides-body]', shell).addEventListener('change', (e) => {
      const box = e.target.closest('[data-slide-id]');
      if (!box) return;
      setFeatured(box.dataset.slideId, box.checked);
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
    login.classList.add('is-open');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    document.body.classList.add('admin-no-scroll');
    setTimeout(() => { const f = $('#admin-id', shell); if (f) f.focus(); }, 120);
  }

  function closeLogin() {
    if (!shell) return;
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
    } else {
      renderSlidesPanel();
    }
    const box = $('[data-admin-' + (which === 'categories' ? 'cats' : 'slides') + ']', shell);
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    document.body.classList.add('admin-no-scroll');
  }

  function closePanels() {
    if (!shell) return;
    state.panel = null;
    $$('[data-admin-slides], [data-admin-cats]', shell).forEach((el) => {
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

  const b64 = (text) => {
    try { return btoa(unescape(encodeURIComponent(String(text)))); } catch (e) { return ''; }
  };
  const fromB64 = (text) => {
    try { return decodeURIComponent(escape(atob(String(text || '')))); } catch (e) { return ''; }
  };

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
    const hash = await sha256Hex(salted);
    if (hash) return hash === BUILTIN.passwordHash;
    return b64(password) === BUILTIN.passwordB64;             // no crypto.subtle
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
  function localSignIn(notice) {
    if (!store || !store.available) {
      return {
        error: 'This browser is not allowing local storage (a private window?), so the built-in account has ' +
          'nowhere to save your edits. Open the site in a normal window, or sign in with a Supabase account.'
      };
    }
    return { admin: localAdmin(), notice: notice || '' };
  }

  async function signIn(identifier, password) {
    const id = String(identifier).trim();
    const builtin = await matchesBuiltin(id, password);

    if (sb) {
      const cloud = await cloudSignIn(id, password);
      if (cloud.admin) return cloud;
      const reason = cloud.error && cloud.error.message ? friendly(cloud.error.message) : 'Supabase sign-in failed.';
      if (builtin) return localSignIn(reason + ' — signed in on this device only.');
      return { error: reason };
    }

    if (builtin) return localSignIn();
    return { error: 'Supabase is not available and that is not the built-in administrator account.' };
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
    if (/fetch|network|failed to fetch/i.test(m)) return 'Cannot reach Supabase. Check the connection and try again.';
    if (/sms|phone provider|twilio|messagebird/i.test(m)) {
      return 'Phone sign-in is not enabled on this Supabase project (Authentication → Providers → Phone). Sign in with the account e-mail instead.';
    }
    if (/not an administrator/i.test(m)) return m;
    return m || 'Sign-in failed.';
  }

  async function finishSignIn() {
    const { data, error } = await sb.rpc('current_admin');
    if (error) return { error: new Error('Signed in, but the admin check failed: ' + error.message) };
    if (!data || !data.id) {
      await sb.auth.signOut();
      return { error: new Error('That Supabase account is not an administrator yet. In the SQL Editor run:  select public.grant_admin(\'' +
        (BUILTIN ? BUILTIN.phoneE164 : 'phone') + '\');') };
    }
    try { await sb.rpc('admin_touch_login'); } catch (e) { /* cosmetic */ }
    data.local = false;
    return { admin: data };
  }

  /* called by js/ghost.js when a session already exists (page reload, next page) */
  async function resume() {
    if (!sb) return false;
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) return false;
    const { data: admin } = await sb.rpc('current_admin');
    if (!admin || !admin.id) return false;
    admin.local = false;
    enter(admin, true);
    return true;
  }

  async function signOut() {
    const local = !!(state.admin && state.admin.local);

    const ok = await confirmDialog({
      title: 'Sign out of admin mode?',
      text: local
        ? 'The website keeps the browser-only changes until you say otherwise.'
        : 'The website stays exactly as it is for visitors.',
      yesLabel: 'Sign out',
      noLabel: 'Stay signed in',
      danger: false
    });
    if (!ok) return;

    if (sb && state.admin && !state.admin.local) {
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
    }

    /* browser-only edits: ask once whether they should stay on this device */
    if (writePath() === 'local' && store && store.active()) {
      const keep = await confirmDialog({
        title: 'Keep the changes on this device?',
        text: 'They were never published to Supabase — only this browser can see them. Keeping them makes this browser show your draft; discarding brings the published site back.',
        yesLabel: 'Keep them',
        noLabel: 'Discard',
        danger: false
      });
      if (!keep) {
        store.clear();
        if (window.SiteContent && SiteContent.restore) SiteContent.restore();
        if (window.SiteContent && SiteContent.load) await SiteContent.load();
      } else if (window.SiteContent && SiteContent.loadLocal) {
        await SiteContent.loadLocal();
      }
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

  function enter(admin, silent) {
    state.admin = admin;
    state.active = true;
    ensureShell();

    /* the built-in account: snapshot what the visitor sees and keep working
       from this browser's own copy (js/store.js) */
    if (admin.local && store) {
      store.begin();
      if (window.SiteContent && SiteContent.loadLocal) SiteContent.loadLocal();
    }

    document.body.classList.add('is-admin');
    openBar();
    updateBar();

    if (window.Site) window.Site.setShowHidden(true);   // triggers a re-render → decorate()
    decorate();

    if (!silent) {
      toast(admin.local
        ? 'Admin mode on — saving in this browser only (see the bar)'
        : 'Admin mode on — every change is published to Supabase');
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

    if (a.local) {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>This device only.</b> ' +
        (sc.status === 'offline'
          ? 'Supabase is not reachable'
          : 'No Supabase admin account matches this login yet') +
        ' — changes are saved in this browser (' + esc(numbers || 'no content loaded') +
        '). To publish for everybody, create the account in Supabase → Authentication → Users with this phone number, then run ' +
        '<code>select public.grant_admin(\'' + esc((BUILTIN && BUILTIN.phoneE164) || '') + '\');</code></span>';
    } else if (sc.status === 'live') {
      el.className = 'admin-bar__status' + (sc.categoriesMissing ? ' admin-bar__status--warn' : '');
      el.innerHTML = icon(sc.categoriesMissing ? 'alert' : 'cloud') + '<span><b>Connected to Supabase.</b> ' + esc(numbers) +
        (sc.categoriesMissing
          ? ' — the chips still come from js/data.js: re-run supabase/schema.sql (§12) to manage them here.'
          : '') + '</span>';
    } else if (sc.status === 'empty') {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>Connected, but the tables are empty.</b> Add items with the + tiles, or run supabase/schema.sql.</span>';
    } else if (sc.status === 'offline') {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>Supabase is not reachable</b> (' + esc(sc.error || 'network') + ').</span>';
    } else {
      el.className = 'admin-bar__status admin-bar__status--warn';
      el.innerHTML = icon('alert') + '<span><b>Built-in content.</b> js/config.js or js/content.js is not loading Supabase.</span>';
    }
  }

  /* which place writes go to: 'cloud' (Supabase), 'local' (this browser) */
  function writePath() {
    if (!state.active || !state.admin) return null;
    if (state.admin.local) return store ? 'local' : null;
    const sc = window.SiteContent || {};
    return (sc.status === 'live' || sc.status === 'empty') ? 'cloud' : null;
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
        /* a slide of the homepage hero: it IS a design, so keep the tools to
           "edit the design" and "take it out of the slideshow" */
        bar.innerHTML =
          '<span class="admin-tools__tag">Slideshow · ' + esc(item.title || '') + '</span>' +
          toolBtn('design', id, 'edit', 'pencil', 'Edit this design') +
          toolBtn('design', id, 'unfeature', 'star', 'Remove from the homepage slideshow', ' is-on');
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
    if (act === 'edit') return openEditor(kind, id);
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

  async function writeUpdate(table, id, patch) {
    if (writePath() === 'local') { store.update(table, id, patch); return { error: null }; }
    const { error } = await sb.from(table).update(patch).eq('id', id);
    return { error: error };
  }

  async function writeInsert(table, payload) {
    if (writePath() === 'local') { store.insert(table, payload); return { error: null }; }
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
    if (e.code === '42501' || /row-level security|new row violates/i.test(msg)) {
      return 'Supabase refused that change — your admin session may have expired. Sign out and sign in again.';
    }
    if (e.code === '23505' || /duplicate key/i.test(msg)) {
      return 'That reference (code or slug) already exists. Change it and save again.';
    }
    if (/Failed to fetch|NetworkError|fetch/i.test(msg)) return 'Cannot reach Supabase — check the connection.';
    if (/column .*is_featured.* does not exist/i.test(msg)) {
      return 'The database does not have the slideshow column yet — run §12 of supabase/schema.sql.';
    }
    if (/column .*category.* does not exist|relation .*categories.* does not exist/i.test(msg)) {
      return 'The database does not have the categories table yet — run §12 of supabase/schema.sql.';
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
    if (/over the size limit|too large|413/i.test(msg)) return 'That photo is bigger than the 8 MB limit.';
    if (/mime|type/i.test(msg)) return 'That file type is not allowed — use JPG, PNG, WebP, AVIF or GIF.';
    if (/bucket not found/i.test(msg)) return 'The “site-media” bucket does not exist yet — run supabase/schema.sql §8.';
    return msg || 'Upload failed.';
  }

  /* a browser-only session has no bucket to write to: shrink the photo and
     keep it inside the local record as a data URL instead */
  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('That file could not be read.'));
      r.readAsDataURL(file);
    });
  }

  async function uploadLocal(file, onStatus) {
    const up = cfg.upload || {};
    const maxBytes = up.maxBytes || 8 * 1024 * 1024;
    if (!file || !/^image\//.test(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF photo.');
    if (file.size > maxBytes) {
      throw new Error('That photo is ' + (file.size / 1048576).toFixed(1) + ' MB — the limit is ' +
        Math.round(maxBytes / 1048576) + ' MB.');
    }
    if (onStatus) onStatus('Preparing the photo…');
    const img = await loadImageFile(file);
    const blob = await canvasBlob(img, up.maxWidth || 1600, Math.min(up.quality || 0.86, 0.8));
    const url = await readAsDataUrl(blob);
    return { full: url, sm: '', xs: '' };
  }

  async function uploadPhoto(folder, file, baseName, onStatus) {
    if (writePath() === 'local') return uploadLocal(file, onStatus);

    const up = cfg.upload || {};
    const widths = up.widths && up.widths.length ? up.widths : [1600, 760, 480];
    const maxBytes = up.maxBytes || 8 * 1024 * 1024;

    if (!file || !/^image\//.test(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF photo.');
    if (file.size > maxBytes) throw new Error('That photo is ' + (file.size / 1048576).toFixed(1) + ' MB — the limit is ' + Math.round(maxBytes / 1048576) + ' MB.');

    const img = await loadImageFile(file);
    const stem = (folder || 'misc') + '/' + (slugify(baseName) || 'photo') + '-' + Date.now().toString(36);
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

    return { full: urls[widths[0]], sm: urls[760] || '', xs: urls[480] || '' };
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
    const variants = (f.variants || []).map((k) =>
      '<input type="hidden" data-fkey="' + k + '" value="' + esc(row[k] || '') + '">').join('');
    return [
      '<div class="admin-field admin-field--image" data-field="' + f.key + '">',
      '  <label>' + esc(f.label) + (f.required ? ' <em>*</em>' : '') + '</label>',
      '  <div class="admin-drop" data-drop tabindex="0" role="button" aria-label="Choose or drop a photo">',
      '    <img data-preview alt=""' + (src ? ' src="' + esc(src) + '"' : ' class="is-empty"') + '>',
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

  function openEditor(kind, id) {
    const col = COLLECTIONS[kind];
    if (!col) return;
    if (!writePath()) {
      toast('Editing is unavailable — see the message in the bar.');
      openBar();
      return;
    }

    const item = id ? findItem(kind, id) : null;
    if (id && !canEdit(item)) { toast('That block is not in the database yet.'); return; }

    ensureShell();
    const row = item && item._row ? Object.assign({}, item._row)
      : (item && writePath() === 'local'
        ? Object.assign({}, localRows(col.table).filter((r) => String(r.id) === String(item.uuid))[0] || {})
        : defaultRow(kind));

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
        setPreview(res.full);
        status.textContent = '';
        state.dirty = true;
        toast(writePath() === 'local'
          ? 'Photo ready — it is stored with your browser-only copy. Remember to save.'
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
     10. HOMEPAGE SLIDESHOW PANEL — one tick per design photo
     ====================================================================== */
  function renderSlidesPanel() {
    ensureShell();
    const body = $('[data-slides-body]', shell);
    const status = $('[data-slides-status]', shell);
    const designs = (window.Site ? window.Site.lists.designs() : []);

    if (!designs.length) {
      body.innerHTML = '<p class="admin-empty">No designs yet. Add one on the Designs page and it will appear here.</p>';
      status.textContent = '';
      return;
    }

    body.innerHTML = designs.map((d) => {
      const on = d.featured === true;
      const hidden = d.active === false;
      return '<label class="admin-slide' + (on ? ' is-on' : '') + (hidden ? ' is-draft' : '') + '">' +
        '<input type="checkbox" data-slide-id="' + esc(String(d.uuid || d.id)) + '"' + (on ? ' checked' : '') + '>' +
        '<span class="admin-slide__thumb">' +
          (d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy">' : '<i>' + icon('starOutline') + '</i>') +
        '</span>' +
        '<span class="admin-slide__text"><b>' + esc(d.title || 'Untitled design') + '</b>' +
          '<small>' + esc(d.category || 'No category') +
          (hidden ? ' · hidden from visitors' : '') +
          (!d.image ? ' · no photo yet' : '') + '</small></span>' +
        '</label>';
    }).join('');

    const featured = designs.filter((d) => d.featured === true && d.active !== false && d.image).length;
    status.innerHTML = featured
      ? '<b>' + featured + '</b> photo' + (featured === 1 ? '' : 's') + ' rotate on the home page, in the order above. ' +
        'Drag-free reordering: use the ← → tools on the Designs page.'
      : '<span class="admin-slide-warn">' + icon('alert') +
        ' Nothing is ticked, so the home page falls back to the first five designs with a photo.</span>';
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
