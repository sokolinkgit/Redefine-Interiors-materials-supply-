/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — ADMIN OVERLAY ("ghost mode")
   --------------------------------------------------------------------------
   Loaded on demand by js/ghost.js. There is no /admin page: once signed in,
   the administrator looks at the ordinary website — the same hero, the same
   cards, the same services page — with a small toolbar floating on every
   block they are allowed to change.

     ✎  edit everything about that block (photo + the text under it)
     ⇄  move it earlier / later
     ⧉  duplicate it
     ◉  hide it from visitors (it stays visible to you, dimmed)
     ✕  delete it

   Plus a "+" tile at the end of every grid, and a dock bottom-left with
   preview-as-visitor, reload and sign out.

   Security lives in Supabase (Row Level Security + public.admins): this file
   is only a convenience. A visitor who downloads it can see the forms but
   every write is rejected by the database.
   ========================================================================== */
(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const sb = window.SiteSupabase;
  if (!sb) return;

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const esc = (v) => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const state = {
    admin: null,        // { id, email, phone, full_name, role }
    active: false,      // toolbars on screen
    preview: false,     // "preview as visitor"
    editing: null,      // { kind, id }
    dirty: false
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
    upload: svg('<path d="M12 16V4.5"/><path d="m7.5 9 4.5-4.5L16.5 9"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>'),
    logout: svg('<path d="M15 4.5h3.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M11 8l-4 4 4 4"/><path d="M7 12h9"/>'),
    lock: svg('<rect x="4.5" y="10" width="15" height="10.5" rx="2.4"/><path d="M8 10V7.4a4 4 0 0 1 8 0V10"/>'),
    refresh: svg('<path d="M20 11a8 8 0 1 0-1.6 6"/><path d="M20 20v-5h-5"/>'),
    shield: svg('<path d="M12 21.5s7.5-3.4 7.5-9.6V5.4L12 2.2 4.5 5.4v6.5c0 6.2 7.5 9.6 7.5 9.6z"/><path d="m9.2 12 2 2 3.6-3.8"/>'),
    alert: svg('<path d="M12 3.5 22 20H2z"/><path d="M12 10v4M12 17.2v.1"/>'),
    /* the site already draws these, but the overlay must work on its own too */
    x: svg('<path d="M18.5 5.5 5.5 18.5M5.5 5.5l13 13"/>'),
    plus: svg('<path d="M12 5.5v13M5.5 12h13"/>'),
    check: svg('<path d="M20 6.5 9.4 17.5 4 12"/>'),
    trash: svg('<path d="M3.5 6.5h17M9 6.5v-2h6v2M6.5 6.5 7.6 20h8.8l1.1-13.5M10.5 10.5v6M13.5 10.5v6"/>')
  };
  const siteIcons = () => (window.Site && window.Site.icons) || {};
  const icon = (name) => AI[name] || siteIcons()[name] || '';

  /* ======================================================================
     2. WHAT CAN BE EDITED — one entry per Supabase table
     ====================================================================== */
  const DESIGN_CATEGORIES = ['Kitchen Cabinets', 'Wardrobes', 'Aluminium Works', 'Gypsum Works', 'Shop Renovation', 'Fittings'];
  const MATERIAL_CATEGORIES = ['Boards & Panels', 'Hardware & Fittings', 'Gypsum & Ceilings', 'Aluminium', 'Tiles & Finishes', 'Countertops', 'Lighting'];
  const SWATCHES = ['mdf', 'laminate', 'hardware', 'steel', 'gypsum', 'aluminium', 'tile', 'fluted', 'quartz', 'led'];
  const MATERIAL_ICONS = ['box', 'palette', 'wrench', 'layers', 'layers2', 'window', 'spark', 'bulb', 'tag'];
  const SERVICE_ICONS = ['cabinet', 'wardrobe', 'window', 'layers', 'shop', 'wrench', 'ruler', 'spark', 'box'];

  const COLLECTIONS = {
    hero_slide: {
      table: 'hero_slides',
      folder: 'hero',
      label: 'Slideshow image',
      plural: 'Homepage slideshow',
      where: 'the homepage slideshow',
      list: () => (window.Site ? window.Site.lists.hero() : []),
      title: (r) => r.label || r.image_alt || 'Slideshow image',
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', required: true, group: 'Photo',
          variants: ['image_url_760', 'image_url_480'],
          help: 'Landscape photos work best (about 1376 × 900). Phone and tablet sizes are created automatically.' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo',
          help: 'One sentence describing the photo — used by screen readers and Google Images.' },
        { key: 'label', label: 'Short name', type: 'text', group: 'Slideshow',
          help: 'Shown to screen readers on the slideshow dot, e.g. “Kitchen cabinets”.' },
        { key: 'position', label: 'Order', type: 'number', group: 'Slideshow', help: 'Lower numbers rotate first.' },
        { key: 'is_active', label: 'Show on the website', type: 'toggle', group: 'Slideshow' }
      ]
    },

    design: {
      table: 'designs',
      folder: 'designs',
      label: 'Design',
      plural: 'Designs',
      where: 'the Designs page and the homepage grid',
      list: () => (window.Site ? window.Site.lists.designs() : []),
      title: (r) => r.title || 'Untitled design',
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', required: true, group: 'Photo',
          variants: ['image_url_760', 'image_url_480'], help: 'Square-ish photos (about 1200 × 900) fill the card best.' },
        { key: 'image_alt', label: 'Alt text', type: 'text', group: 'Photo',
          help: 'Leave blank to use “<Title> — <Category> by Redefine Interiors”.' },
        { key: 'title', label: 'Title', type: 'text', required: true, group: 'Text under the photo',
          placeholder: 'Modern L-Shaped Kitchen Cabinets' },
        { key: 'summary', label: 'Summary', type: 'textarea', group: 'Text under the photo',
          help: 'Two or three sentences. This is the paragraph visitors read on the card and in the detail pop-up.' },
        { key: 'features', label: 'What is included', type: 'lines', group: 'Text under the photo',
          help: 'One line each. The first three appear as chips on the card; all of them in the detail pop-up.' },
        { key: 'materials', label: 'Materials used', type: 'lines', group: 'Text under the photo', help: 'One line each.' },
        { key: 'category', label: 'Category', type: 'combo', options: DESIGN_CATEGORIES, group: 'Card details',
          help: 'Drives the filters. Type a new one to create a new category.' },
        { key: 'badge', label: 'Badge', type: 'text', group: 'Card details', placeholder: 'Best seller',
          help: 'Small corner label. Leave blank for none.' },
        { key: 'lead_time', label: 'Typical time', type: 'text', group: 'Card details', placeholder: '2 – 3 weeks' },
        { key: 'unit', label: 'Scope note', type: 'text', group: 'Card details', placeholder: 'per sqm',
          help: 'Optional — appears in the WhatsApp quotation message.' },
        { key: 'position', label: 'Order', type: 'number', group: 'Placement',
          help: 'Lower numbers appear first. The homepage shows the first six.' },
        { key: 'is_active', label: 'Show on the website', type: 'toggle', group: 'Placement' }
      ]
    },

    material: {
      table: 'materials',
      folder: 'materials',
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
        { key: 'category', label: 'Category', type: 'combo', options: MATERIAL_CATEGORIES, group: 'Card details',
          help: 'Drives the filters. Type a new one to create a new category.' },
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
     3. SHELL — sign-in panel, dock, editor drawer, confirm dialog
     ====================================================================== */
  let shell = null;

  function ensureShell() {
    if (shell) return shell;

    const wrap = document.createElement('div');
    wrap.className = 'admin-ui';
    wrap.innerHTML = [
      '<div class="admin-scrim" data-admin-scrim></div>',

      /* ---- sign in ---------------------------------------------------- */
      '<div class="admin-login" data-admin-login role="dialog" aria-modal="true" aria-label="Administrator sign in">',
      '  <div class="admin-login__panel">',
      '    <button class="admin-x" type="button" data-login-close aria-label="Close sign in">' + icon('x') + '</button>',
      '    <span class="admin-eyebrow">' + icon('lock') + ' Staff only</span>',
      '    <h3>Admin sign in</h3>',
      '    <p class="admin-login__lead">Use the <b>e-mail address or phone number</b> of your Supabase account, and its password.</p>',
      '    <form class="admin-login__form" data-login-form novalidate>',
      '      <div class="field">',
      '        <label for="admin-id">E-mail or phone number</label>',
      '        <input id="admin-id" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="you@example.com or 0703142874" required>',
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
      '    <p class="admin-login__foot">Accounts live in Supabase → Authentication → Users. The first account you create becomes the owner.</p>',
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
      '</div>',

      /* ---- dock ------------------------------------------------------- */
      '<div class="admin-dock" data-admin-dock aria-label="Administrator tools">',
      '  <button class="admin-dock__tab" type="button" data-dock-toggle aria-expanded="false">' + icon('shield') + '</button>',
      '  <div class="admin-dock__panel">',
      '    <div class="admin-dock__who">',
      '      <strong>Admin mode</strong>',
      '      <small data-dock-who>signed in</small>',
      '    </div>',
      '    <p class="admin-dock__status" data-dock-status></p>',
      '    <div class="admin-dock__btns">',
      '      <button class="admin-chip" type="button" data-dock="preview">' + icon('eye') + ' Preview as visitor</button>',
      '      <button class="admin-chip" type="button" data-dock="reload">' + icon('refresh') + ' Reload content</button>',
      '      <button class="admin-chip admin-chip--danger" type="button" data-dock="signout">' + icon('logout') + ' Sign out</button>',
      '    </div>',
      '    <p class="admin-dock__hint">Tap the logo five times to bring this back.</p>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(wrap);
    shell = wrap;
    wireShell();
    return shell;
  }

  function wireShell() {
    const scrim = $('[data-admin-scrim]', shell);

    /* ---- sign in ---- */
    const login = $('[data-admin-login]', shell);
    const form = $('[data-login-form]', shell);
    const err = $('[data-login-error]', shell);
    const submit = $('[data-login-submit]', shell);

    scrim.addEventListener('click', () => {
      if (login.classList.contains('is-open')) closeLogin();
      else if ($('[data-admin-drawer]', shell).classList.contains('is-open')) closeEditor();
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
      if (!id || !pw) { err.textContent = 'Enter both your e-mail/phone and your password.'; return; }

      submit.disabled = true;
      submit.innerHTML = 'Signing in…';
      const result = await signIn(id, pw);
      submit.disabled = false;
      submit.innerHTML = 'Sign in';

      if (result.error) { err.textContent = result.error; return; }
      form.reset();
      closeLogin();
      enter(result.admin);
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

    /* ---- dock ---- */
    $('[data-dock-toggle]', shell).addEventListener('click', (e) => {
      const dock = $('[data-admin-dock]', shell);
      const open = dock.classList.toggle('is-open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    shell.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dock]');
      if (!btn) return;
      const act = btn.dataset.dock;
      if (act === 'preview') togglePreview();
      if (act === 'reload') reloadContent();
      if (act === 'signout') signOut();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if ($('[data-admin-confirm]', shell).classList.contains('is-open')) settleConfirm(false);
      else if ($('[data-admin-drawer]', shell).classList.contains('is-open')) closeEditor();
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
    if (!$('[data-admin-drawer]', shell).classList.contains('is-open')) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
  }

  function openDock() {
    ensureShell();
    const dock = $('[data-admin-dock]', shell);
    dock.classList.add('is-open');
    $('[data-dock-toggle]', shell).setAttribute('aria-expanded', 'true');
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
    box.classList.add('is-open');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    return new Promise((resolve) => { confirmResolver = resolve; });
  }
  function settleConfirm(value) {
    if (!shell) return;
    $('[data-admin-confirm]', shell).classList.remove('is-open');
    if (!$('[data-admin-login]', shell).classList.contains('is-open') &&
        !$('[data-admin-drawer]', shell).classList.contains('is-open')) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
    }
    if (confirmResolver) { const r = confirmResolver; confirmResolver = null; r(value); }
  }

  /* ======================================================================
     4. SIGN-IN — e-mail OR phone number, exactly as set in Supabase Auth
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

  async function tryEmail(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    return { data: data, error: error };
  }

  async function signIn(identifier, password) {
    const id = String(identifier).trim();

    /* 1. an e-mail address is unambiguous */
    if (EMAIL_RE.test(id)) {
      const { error } = await tryEmail(id, password);
      if (error) return { error: friendly(error.message) };
      return finishSignIn();
    }

    /* 2. a phone number: try every shape Supabase may have stored */
    const candidates = phoneCandidates(id);
    if (candidates.length) {
      for (let i = 0; i < candidates.length; i++) {
        const { error } = await sb.auth.signInWithPassword({ phone: candidates[i], password: password });
        if (!error) return finishSignIn();
        if (!badCredentials(error.message)) return { error: friendly(error.message) };
      }
      /* 3. the account may exist with an e-mail while the admin typed the
            phone number they are known by — ask the database for the match */
      try {
        const { data } = await sb.rpc('resolve_admin_email', { p_phone: candidates[0] });
        if (data) {
          const { error } = await tryEmail(data, password);
          if (!error) return finishSignIn();
        }
      } catch (e) { /* rpc missing — fall through */ }
      return { error: 'No administrator account matches that phone number. Check the number, or sign in with the e-mail of the account.' };
    }

    return { error: 'Enter a valid e-mail address or phone number.' };
  }

  function friendly(message) {
    const m = String(message || '');
    if (badCredentials(m)) return 'Wrong e-mail/phone or password.';
    if (/email not confirmed/i.test(m)) return 'That account is not confirmed yet. Confirm it in Supabase → Authentication → Users.';
    if (/phone not confirmed/i.test(m)) return 'That phone number is not confirmed yet. Confirm it in Supabase → Authentication → Users.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
    if (/fetch|network|failed to fetch/i.test(m)) return 'Cannot reach Supabase. Check the connection and try again.';
    if (/sms|phone provider|twilio|messagebird/i.test(m)) {
      return 'Phone sign-in is not enabled on this Supabase project (Authentication → Providers → Phone). Sign in with the account e-mail instead.';
    }
    return m || 'Sign-in failed.';
  }

  async function finishSignIn() {
    const { data, error } = await sb.rpc('current_admin');
    if (error) return { error: 'Signed in, but the admin check failed: ' + error.message };
    if (!data || !data.id) {
      await sb.auth.signOut();
      return { error: 'That account is not an administrator. In the SQL Editor run:  select public.grant_admin(\'their@email\');' };
    }
    try { await sb.rpc('admin_touch_login'); } catch (e) { /* cosmetic */ }
    return { admin: data };
  }

  /* called by js/ghost.js when a session already exists (page reload, next page) */
  async function resume() {
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) return false;
    const { data: admin } = await sb.rpc('current_admin');
    if (!admin || !admin.id) return false;
    enter(admin, true);
    return true;
  }

  async function signOut() {
    const ok = await confirmDialog({
      title: 'Sign out of admin mode?',
      text: 'The website stays exactly as it is for visitors.',
      yesLabel: 'Sign out',
      danger: false
    });
    if (!ok) return;
    try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
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
    state.preview = false;
    ensureShell();

    document.body.classList.add('is-admin');
    document.body.classList.remove('is-admin-preview');
    $('[data-dock-who]', shell).textContent = admin.full_name || admin.email || admin.phone || 'administrator';
    $('[data-dock="preview"]', shell).innerHTML = icon('eye') + ' Preview as visitor';
    updateDockStatus();

    if (window.Site) window.Site.setShowHidden(true);   // triggers a re-render → decorate()
    decorate();
    openDock();
    if (!silent) toast('Admin mode on — you can now edit everything on this page');
  }

  function exit() {
    state.active = false;
    state.preview = false;
    state.admin = null;
    state.editing = null;
    undecorate();
    if (shell) {
      $('[data-admin-drawer]', shell).classList.remove('is-open');
      $('[data-admin-drawer]', shell).setAttribute('aria-hidden', 'true');
      $('[data-admin-dock]', shell).classList.remove('is-open');
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
    document.body.classList.remove('is-admin', 'is-admin-preview');
    if (window.Site) window.Site.setShowHidden(false);
  }

  function togglePreview() {
    state.preview = !state.preview;
    document.body.classList.toggle('is-admin-preview', state.preview);
    const btn = $('[data-dock="preview"]', shell);
    btn.innerHTML = icon(state.preview ? 'pencil' : 'eye') + (state.preview ? ' Back to editing' : ' Preview as visitor');
    if (window.Site) window.Site.setShowHidden(!state.preview);   // re-renders → decorate()
    toast(state.preview ? 'Previewing exactly what a visitor sees' : 'Editing tools back on');
  }

  function updateDockStatus() {
    if (!shell) return;
    const el = $('[data-dock-status]', shell);
    const sc = window.SiteContent || {};
    const c = sc.counts || {};
    if (sc.status === 'live') {
      el.className = 'admin-dock__status';
      el.innerHTML = '<b>Connected to Supabase.</b> ' +
        [c.hero_slides ? c.hero_slides + ' slides' : '', c.designs ? c.designs + ' designs' : '',
         c.materials ? c.materials + ' materials' : '', c.services ? c.services + ' services' : '']
          .filter(Boolean).join(' · ');
    } else if (sc.status === 'empty') {
      el.className = 'admin-dock__status admin-dock__status--warn';
      el.innerHTML = '<b>Connected, but the tables are empty.</b> Run §10 of supabase/schema.sql to load the current content, or add items with the + tiles.';
    } else if (sc.status === 'offline') {
      el.className = 'admin-dock__status admin-dock__status--warn';
      el.innerHTML = '<b>Supabase is not reachable</b> (' + esc(sc.error || 'network') + '). The page is showing the built-in content; editing is disabled until the connection returns.';
    } else {
      el.className = 'admin-dock__status admin-dock__status--warn';
      el.innerHTML = '<b>Built-in content.</b> js/config.js or js/content.js is not loading Supabase.';
    }
  }

  async function reloadContent() {
    toast('Reloading content…');
    if (window.SiteContent && window.SiteContent.load) await window.SiteContent.load();
    updateDockStatus();
    decorate();
    toast('Content reloaded');
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

  const canEdit = (item) => !!(item && item.uuid);

  function toolBtn(kind, id, act, iconName, label, extra) {
    return '<button class="admin-tool' + (extra || '') + '" type="button" data-admin-act="' + act + '"' +
      ' data-admin-kind="' + kind + '" data-admin-id="' + esc(id) + '" title="' + esc(label) + '" aria-label="' + esc(label) + '">' +
      icon(iconName) + '</button>';
  }

  function decorate() {
    if (!state.active || state.preview) return;
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
      bar.innerHTML =
        '<span class="admin-tools__tag">' + esc(col.label) + (hidden ? ' · hidden' : '') + '</span>' +
        toolBtn(kind, id, 'edit', 'pencil', 'Edit this ' + col.label.toLowerCase()) +
        (kind === 'hero_slide' ? '' : toolBtn(kind, id, 'dup', 'copy', 'Duplicate')) +
        toolBtn(kind, id, 'move-left', 'left', 'Move earlier') +
        toolBtn(kind, id, 'move-right', 'right', 'Move later') +
        toolBtn(kind, id, 'toggle', hidden ? 'eyeOff' : 'eye',
          hidden ? 'Show on the website' : 'Hide from visitors', hidden ? ' is-off' : '') +
        toolBtn(kind, id, 'delete', 'trash', 'Delete', ' admin-tool--danger');

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
    $$('.admin-add, .admin-add-slide').forEach((el) => el.remove());
    $$('.admin-editable').forEach((el) => el.classList.remove('admin-editable', 'admin-hidden-item'));
  }

  function addTiles() {
    if (!state.active || state.preview) return;

    GRID_KIND.forEach((g) => {
      const col = COLLECTIONS[g.kind];
      $$(g.sel).forEach((grid) => {
        if (grid.querySelector('.admin-add')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'admin-add' + (g.sel === '[data-service-blocks]' ? ' admin-add--wide' : '');
        btn.dataset.adminAct = 'new';
        btn.dataset.adminKind = g.kind;
        btn.innerHTML = icon('plus') + '<span>Add ' + esc(col.label.toLowerCase()) + '</span><small>It appears at the end of ' + esc(col.where) + '</small>';
        grid.appendChild(btn);
      });
    });

    /* the homepage slideshow gets its "+" beside the arrows */
    const arrows = $('.hero__arrows');
    if (arrows && !arrows.querySelector('[data-admin-act="new"]')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'arrow-btn admin-add-slide';
      b.dataset.adminAct = 'new';
      b.dataset.adminKind = 'hero_slide';
      b.title = 'Add a slideshow image';
      b.setAttribute('aria-label', 'Add a slideshow image');
      b.innerHTML = icon('plus');
      arrows.appendChild(b);
    }
  }

  /* one capture-phase listener for every toolbar / tile button, so the site's
     own handlers (card click → detail pop-up) never fire for admin actions */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-admin-act]');
    if (!btn || !state.active || state.preview) return;
    e.preventDefault();
    e.stopPropagation();

    const act = btn.dataset.adminAct;
    const kind = btn.dataset.adminKind;
    const id = btn.dataset.adminId;

    if (act === 'new') return openEditor(kind, null);
    if (act === 'edit') return openEditor(kind, id);
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
     7. CRUD
     ====================================================================== */
  function maxPosition(col) {
    return (col.list() || []).reduce((m, x) => Math.max(m, Number(x.position) || 0), 0);
  }

  function nextCode(kind) {
    const prefix = { design: 'd', material: 'm', hero_slide: 'h' }[kind];
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
    const col = COLLECTIONS[kind];
    const item = findItem(kind, id);
    if (!col || !canEdit(item)) return;

    const list = (col.list() || []).slice().sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
    const from = list.findIndex((x) => String(x.uuid) === String(item.uuid));
    const to = from + dir;
    if (from < 0 || to < 0 || to >= list.length) { toast(dir < 0 ? 'Already first' : 'Already last'); return; }

    list.splice(to, 0, list.splice(from, 1)[0]);
    try {
      await Promise.all(list.map((x, i) =>
        sb.from(col.table).update({ position: (i + 1) * 10 }).eq('id', x.uuid)));
      await reloadContent();
    } catch (err) { toast(writeError(err)); }
  }

  async function toggleVisible(kind, id) {
    const col = COLLECTIONS[kind];
    const item = findItem(kind, id);
    if (!col || !canEdit(item)) return;
    const next = item.active === false;
    const { error } = await sb.from(col.table).update({ is_active: next }).eq('id', item.uuid);
    if (error) return toast(writeError(error));
    item.active = next;                       // instant feedback …
    if (window.Site) window.Site.refresh();    // … then the real thing
    toast(next ? 'Visible on the website again' : 'Hidden from visitors (you can still see it)');
  }

  async function removeRecord(kind, uuid) {
    const col = COLLECTIONS[kind];
    const { error } = await sb.from(col.table).delete().eq('id', uuid);
    if (error) return toast(writeError(error));
    closeEditor(true);
    await reloadContent();
    toast(col.label + ' deleted');
  }

  async function duplicateRecord(kind, id) {
    const col = COLLECTIONS[kind];
    const item = findItem(kind, id);
    if (!col || !canEdit(item)) return;
    toast('Duplicating…');

    const { data: row, error } = await sb.from(col.table).select('*').eq('id', item.uuid).single();
    if (error || !row) return toast(writeError(error || new Error('not found')));

    const copy = Object.assign({}, row);
    ['id', 'created_at', 'updated_at', 'created_by', 'updated_by'].forEach((k) => delete copy[k]);
    copy.position = maxPosition(col) + 10;
    copy.is_active = false;                   // a copy starts hidden, so nothing surprises a visitor

    if (kind === 'service') {
      copy.title = row.title + ' (copy)';
      copy.slug = uniqueSlug(row.title + ' copy');
    } else if (copy.code !== undefined) {
      copy.code = nextCode(kind);
      const nameKey = kind === 'design' ? 'title' : kind === 'material' ? 'name' : 'label';
      copy[nameKey] = (row[nameKey] || '') + ' (copy)';
    }

    const { error: ins } = await sb.from(col.table).insert(copy);
    if (ins) return toast(writeError(ins));
    await reloadContent();
    toast('Duplicated — the copy is hidden until you publish it');
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

  async function uploadPhoto(folder, file, baseName, onStatus) {
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
        (f.options || []).map((o) => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join('') +
        '</select>' + help + '</div>';
    }
    if (f.type === 'combo') {
      const dl = 'dl-' + f.key;
      return '<div class="admin-field" data-field="' + f.key + '">' + label +
        '<input id="' + id + '" type="text" list="' + dl + '" data-fkey="' + f.key + '" value="' + esc(v || '') + '" placeholder="' + esc(f.placeholder || '') + '">' +
        '<datalist id="' + dl + '">' + (f.options || []).map((o) => '<option value="' + esc(o) + '"></option>').join('') + '</datalist>' + help + '</div>';
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
      if (f.type === 'toggle') row[f.key] = true;
      else if (f.type === 'number') row[f.key] = maxPosition(col) + 10;
      else if (f.type === 'lines' || f.type === 'pairs') row[f.key] = [];
      else row[f.key] = '';
      (f.variants || []).forEach((k) => { row[k] = ''; });
    });
    return row;
  }

  function openEditor(kind, id) {
    const col = COLLECTIONS[kind];
    if (!col) return;
    if (!editableContent()) {
      toast('Editing is off while Supabase is unreachable — see the dock.');
      openDock();
      return;
    }

    const item = id ? findItem(kind, id) : null;
    if (id && !canEdit(item)) { toast('That block is not in Supabase yet.'); return; }

    ensureShell();
    const row = item && item._row ? Object.assign({}, item._row) : defaultRow(kind);

    state.editing = { kind: kind, uuid: item ? item.uuid : null, item: item || {} };
    state.dirty = false;
    if (window.SiteContent) window.SiteContent.paused = true;   // no realtime reload while typing

    $('[data-editor-where]', shell).innerHTML = icon('image') + ' ' + esc(col.plural);
    $('[data-editor-title]', shell).textContent = (item ? 'Edit ' : 'New ') + col.label.toLowerCase();
    $('[data-editor-error]', shell).textContent = '';
    $('[data-editor-body]', shell).innerHTML = formHtml(col, row);
    $('[data-editor-body]', shell).scrollTop = 0;
    $('[data-editor-delete]', shell).style.display = item ? '' : 'none';
    $('[data-editor-save] span', shell).textContent = item ? 'Save changes' : 'Create ' + col.label.toLowerCase();

    wireForm(col);

    const drawer = $('[data-admin-drawer]', shell);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    $('[data-admin-scrim]', shell).classList.add('is-open');
    document.body.classList.add('admin-no-scroll');
    const first = $('[data-editor-body] input[type="text"], [data-editor-body] textarea', shell);
    if (first) setTimeout(() => first.focus(), 160);
  }

  function closeEditor(force) {
    if (!shell || !state.editing) return;
    if (!force && state.dirty) {
      confirmDialog({
        title: 'Discard these changes?',
        text: 'Nothing has been saved yet.',
        yesLabel: 'Discard'
      }).then((ok) => { if (ok) closeEditor(true); });
      return;
    }
    const drawer = $('[data-admin-drawer]', shell);
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (!$('[data-admin-confirm]', shell).classList.contains('is-open')) {
      $('[data-admin-scrim]', shell).classList.remove('is-open');
      document.body.classList.remove('admin-no-scroll');
    }
    state.editing = null;
    state.dirty = false;
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
        toast('Photo uploaded — remember to save');
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
        payload[f.key] = f.type === 'toggle' ? true : f.type === 'number' ? 0
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

    payload.updated_by = state.admin ? state.admin.id : null;
    if (!ed.uuid) {
      payload.created_by = state.admin ? state.admin.id : null;
      if (kind !== 'service') payload.code = nextCode(kind);
      payload.position = Number(payload.position) || (maxPosition(col) + 10);
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
        ? await sb.from(col.table).update(payload).eq('id', ed.uuid).select().single()
        : await sb.from(col.table).insert(payload).select().single();
      if (res.error) throw res.error;

      state.dirty = false;
      closeEditor(true);
      await reloadContent();
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

  /* is the database actually usable for writing right now? */
  function editableContent() {
    const sc = window.SiteContent || {};
    return sc.status === 'live' || sc.status === 'empty';
  }

  /* ======================================================================
     10. WIRING & PUBLIC API
     ====================================================================== */
  /* keep the toolbars in step with every re-render of the page */
  document.addEventListener('site:rendered', () => {
    if (!state.active) return;
    undecorate();
    decorate();
  });
  document.addEventListener('site:content', () => {
    updateDockStatus();
    if (state.active) { undecorate(); decorate(); }
  });

  window.SiteAdmin = {
    openLogin: openLogin,
    openDock: openDock,
    resume: resume,
    signOut: signOut,
    isActive: () => state.active && !state.preview,
    isSignedIn: () => !!state.admin,
    decorate: decorate,
    undecorate: undecorate,
    reload: reloadContent,
    state: state
  };
})();
