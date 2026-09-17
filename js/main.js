/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — main.js
   Vanilla JavaScript only. No frameworks, no dependencies.
   --------------------------------------------------------------------------
   Sections
   A. Helpers, icons & WhatsApp links
   B. Site chrome (floating actions, quote drawer, toasts)
   C. Header, mobile nav & scroll UI
   D. Hero slideshow (5 interiors, 3 second refresh)
   E. Review carousel (batches of 3, 5 second refresh)
   F. Catalogue rendering, filters & detail modal
   G. Quotation list (localStorage)
   H. FAQ, forms, counters & reveal animations
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     A. HELPERS, ICONS & WHATSAPP LINKS
     ====================================================================== */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  const SVG = (inner, filled) =>
    '<svg viewBox="0 0 24 24" ' + (filled
      ? 'fill="currentColor" stroke="none"'
      : 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"') +
    ' aria-hidden="true" focusable="false">' + inner + '</svg>';

  const ICONS = {
    whatsapp: SVG('<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.19.05-.37-.03-.52-.07-.15-.66-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.12-.28-.2-.58-.35M12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.49-8.4"/>', true),
    phone: SVG('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    mail: SVG('<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 5.2L2 7"/>'),
    pin: SVG('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
    clock: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>'),
    star: SVG('<path d="M12 2.6l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.66l-5.9 3.1 1.13-6.57L2.45 9.54l6.6-.96z"/>', true),
    starHalf: SVG('<path d="M12 2.6v15.06l-5.9 3.1 1.13-6.57L2.45 9.54l6.6-.96z"/>', true),
    check: SVG('<path d="M20 6.5 9.4 17.5 4 12"/>'),
    checkCircle: SVG('<circle cx="12" cy="12" r="9"/><path d="m8.4 12.4 2.5 2.5 4.7-5.1"/>'),
    spark: SVG('<path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z"/><path d="M18.6 15.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>'),
    shield: SVG('<path d="M12 22s8-3.7 8-10V5.2L12 2 4 5.2V12c0 6.3 8 10 8 10z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    truck: SVG('<path d="M1.5 4.5h12v12h-12z"/><path d="M13.5 9h3.6l3.4 3.4v4.1h-7z"/><circle cx="5.6" cy="18.6" r="1.9"/><circle cx="17.4" cy="18.6" r="1.9"/>'),
    ruler: SVG('<path d="m3 17.5 14.5-14.5 4 4L7 21.5z"/><path d="m7.2 13.3 2.2 2.2M10.4 10.1l2.2 2.2M13.6 6.9l2.2 2.2"/>'),
    pin2: SVG('<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'),
    cabinet: SVG('<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 12h18M12 3v18M7 7.5h1.5M15.5 16.5H17"/>'),
    wardrobe: SVG('<rect x="4" y="2.5" width="16" height="19" rx="2.2"/><path d="M12 2.5v19M9 7.5v3.5M15 7.5v3.5"/>'),
    window: SVG('<rect x="3" y="3" width="18" height="18" rx="1.6"/><path d="M3 12h18M12 3v18M7 7.5h1M16.5 16.5H18"/>'),
    layers: SVG('<path d="m12 2.5 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    shop: SVG('<path d="M3 9.2 4.6 4h14.8L21 9.2"/><path d="M4.6 9.2V20h14.8V9.2"/><path d="M9.5 20v-6h5v6"/><path d="M3 9.2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'),
    wrench: SVG('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>'),
    layers2: SVG('<path d="M4 6h16M4 12h16M4 18h10"/>'),
    users: SVG('<path d="M16 20v-1.5a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4V20"/><circle cx="9.2" cy="7" r="3.6"/><path d="M18.5 20v-1.6a4 4 0 0 0-3-3.87"/><path d="M15.2 3.6a3.6 3.6 0 0 1 0 6.9"/>'),
    tag: SVG('<path d="M20.6 13.4 12.9 21a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 2.5 12.6V4A1.5 1.5 0 0 1 4 2.5h8.6a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.7z"/><circle cx="7.5" cy="7.5" r="1.4"/>'),
    box: SVG('<path d="m12 2 8.5 4.6v10.8L12 22l-8.5-4.6V6.6z"/><path d="m3.5 6.6 8.5 4.6 8.5-4.6M12 11.2V22"/>'),
    wallet: SVG('<path d="M3 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v.5"/><rect x="3" y="7.5" width="18" height="12" rx="2.4"/><circle cx="16.6" cy="13.5" r="1.3"/>'),
    calendar: SVG('<rect x="3" y="5" width="18" height="16" rx="2.4"/><path d="M8 3v4M16 3v4M3 10.5h18"/>'),
    cart: SVG('<circle cx="9.5" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2.6l2.6 12.2A2 2 0 0 0 9.16 17H19a2 2 0 0 0 1.96-1.6L22.5 7.4H6.1"/>'),
    palette: SVG('<path d="M12 22a9 9 0 1 1 9-9c0 1.9-1.6 2.9-3 2.9h-1.4a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 22z"/><circle cx="8.2" cy="11.4" r="1.1"/><circle cx="12" cy="7.6" r="1.1"/><circle cx="15.8" cy="11.4" r="1.1"/>'),
    bulb: SVG('<path d="M9.2 18h5.6M10.2 21.5h3.6"/><path d="M12 2.5a6.8 6.8 0 0 0-3.9 12.4V18h7.8v-3.1A6.8 6.8 0 0 0 12 2.5z"/>'),
    image: SVG('<rect x="3" y="4" width="18" height="16" rx="2.4"/><circle cx="9" cy="10" r="1.7"/><path d="m4 18 5.2-5.2 4 4 3-3L20 17"/>'),
    send: SVG('<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>'),
    x: SVG('<path d="M18.5 5.5 5.5 18.5M5.5 5.5l13 13"/>'),
    plus: SVG('<path d="M12 5.5v13M5.5 12h13"/>'),
    minus: SVG('<path d="M5.5 12h13"/>'),
    trash: SVG('<path d="M3.5 6.5h17M9 6.5v-2h6v2M6.5 6.5 7.6 20h8.8l1.1-13.5M10.5 10.5v6M13.5 10.5v6"/>'),
    arrowLeft: SVG('<path d="M19 12H5.5M11 18.5 4.5 12 11 5.5"/>'),
    arrowRight: SVG('<path d="M5 12h13.5M13 5.5 19.5 12 13 18.5"/>'),
    arrowUp: SVG('<path d="M12 19V5.5M5.5 12 12 5.5 18.5 12"/>'),
    chevronDown: SVG('<path d="m6 9.5 6 6 6-6"/>'),
    quote: SVG('<path d="M9.5 6C6.5 7.2 5 9.6 5 13v5h5v-6H7.6c.2-1.9 1.1-3.3 2.9-4.2zM19.5 6C16.5 7.2 15 9.6 15 13v5h5v-6h-2.4c.2-1.9 1.1-3.3 2.9-4.2z"/>', true),
    facebook: SVG('<path d="M13.5 22v-8h2.8l.42-3.3H13.5V8.6c0-.95.26-1.6 1.63-1.6h1.74V4.05A23 23 0 0 0 14.5 4c-2.4 0-4.05 1.47-4.05 4.17v2.53H7.6V14h2.85v8z"/>', true),
    instagram: SVG('<rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1"/>'),
    tiktok: SVG('<path d="M16 3c.4 2.2 1.9 3.8 4 4.1v3c-1.5 0-2.9-.5-4-1.3v5.7c0 3.3-2.4 5.8-5.6 5.8S4.9 18.4 4.9 15.2c0-3 2.3-5.5 5.3-5.7v3.1c-1.3.2-2.2 1.2-2.2 2.6 0 1.5 1.1 2.6 2.6 2.6s2.5-1.1 2.5-2.7V3z"/>', true)
  };

  /* used for price-list rows that have no product photograph yet */
  const CATEGORY_ICON = {
    'Boards & Panels': 'box',
    'Hardware & Fittings': 'wrench',
    'Gypsum & Ceilings': 'layers',
    'Aluminium': 'window',
    'Tiles & Finishes': 'palette',
    'Countertops': 'spark',
    'Lighting': 'bulb'
  };

  const SERVICE_ICON = {
    'kitchen-cabinets': 'cabinet',
    wardrobes: 'wardrobe',
    'aluminium-works': 'window',
    'gypsum-works': 'layers',
    'shop-renovation': 'shop',
    fittings: 'wrench'
  };

  /* --- responsive images ------------------------------------------------
     Every catalogue photo ships in three sizes next to each other:
       assets/img/<name>.jpg        (full,  1200–1400px)
       assets/img/sm/<name>-760.jpg (tablet / retina phone)
       assets/img/sm/<name>-480.jpg (phone)
     Phones therefore never download a 130KB+ full-size photo.            */
  const FULL_WIDTH = (src) => {
    if (/^assets\/img\/d-/.test(src)) return 1200;
    if (/^assets\/img\/hero-/.test(src)) return 1376;
    return 1240;
  };
  const sized = (src, w) => src.replace(/^(.*\/)([^/]+)\.jpg$/, '$1' + 'sm/' + '$2-' + w + '.jpg');

  const responsiveImg = (src, alt, sizes, opts) => {
    const o = opts || {};
    const widths = o.full ? [480, 760, FULL_WIDTH(src)] : [480, 760];
    const set = widths.map((w) => (w === FULL_WIDTH(src) && o.full ? src : sized(src, w)) + ' ' + w + 'w').join(', ');
    return '<img src="' + src + '" srcset="' + set + '" sizes="' + sizes + '" alt="' + escapeHtml(alt) + '"' +
      ' loading="' + (o.eager ? 'eager' : 'lazy') + '" decoding="async"' +
      (o.cls ? ' class="' + o.cls + '"' : '') + '>';
  };

  const money = (n) => 'KES ' + Number(n).toLocaleString('en-KE');
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const stars = (rating, cls) => {
    let out = '<span class="stars ' + (cls || '') + '" role="img" aria-label="' + rating + ' out of 5 stars">';
    for (let i = 1; i <= 5; i++) {
      out += i <= rating ? ICONS.star : ICONS.starHalf;
    }
    return out + '</span>';
  };

  /* --- WhatsApp --------------------------------------------------------- */
  const WA_NUMBER = BUSINESS.waPrimary;
  const waLink = (message, number) =>
    'https://wa.me/' + (number || WA_NUMBER) + '?text=' + encodeURIComponent(message);

  const MSG = {
    general: 'Hello ' + BUSINESS.name + ' 👋\n\nI found you online and I would like to request a quotation.',
    design: (item) => 'Hello ' + BUSINESS.name + ' 👋\n\nI would like to request a quotation for this design:\n\n*' +
      item.title + '*\nCategory: ' + item.category +
      '\nIndicative price: ' + money(item.price) + (item.unit ? ' ' + item.unit : ' (from)') +
      '\n\nMy location: ______\nPreferred start date: ______\n\nPlease send me a detailed quotation. Thank you!',
    material: (item) => 'Hello ' + BUSINESS.name + ' 👋\n\nI would like to request a quotation for this material:\n\n*' +
      item.name + '*\nPrice guide: ' + money(item.price) + ' ' + item.unit +
      '\nQuantity needed: ______\n\nMy delivery location: ______\n\nPlease confirm availability and total cost. Thank you!',
    service: (s) => 'Hello ' + BUSINESS.name + ' 👋\n\nI would like a quotation for *' + s.title + '*.\n\n' +
      'Approximate budget: from ' + money(s.from) + '\nMy location: ______\n\nPlease advise on the next step.'
  };

  const openWa = (message, number) => {
    const win = window.open(waLink(message, number), '_blank', 'noopener');
    if (!win) window.location.href = waLink(message, number);
  };

  /* ======================================================================
     B. SITE CHROME — floating actions, drawer shell, toasts
     ====================================================================== */
  function buildChrome() {
    if ($('.drawer')) return;
    const pageTitle = document.body.dataset.pageTitle || 'this project';
    const chrome = document.createElement('div');
    chrome.innerHTML = [
      '<div class="overlay" data-overlay></div>',

      '<aside class="drawer" id="quoteDrawer" aria-hidden="true" aria-label="Quotation list">',
      '  <div class="drawer__head">',
      '    <div><h3>Your quotation list</h3><span data-quote-summary>No items yet</span></div>',
      '    <button class="drawer__close" type="button" data-close-drawer aria-label="Close quotation list">' + ICONS.x + '</button>',
      '  </div>',
      '  <div class="drawer__body" data-quote-body></div>',
      '  <div class="drawer__foot">',
      '    <div class="drawer__total"><span>Estimated total</span><strong data-quote-total>KES 0</strong></div>',
      '    <button class="btn btn--wa btn--block" type="button" data-quote-send>' + ICONS.whatsapp + ' Request quotation on WhatsApp</button>',
      '    <button class="btn btn--light btn--block" type="button" data-quote-clear>Clear list</button>',
      '    <p class="drawer__hint">Prices are indicative starting rates. Site inspection refines the final figure — free within Nairobi.</p>',
      '  </div>',
      '</aside>',

      '<div class="modal" data-modal aria-hidden="true" role="dialog" aria-modal="true">',
      '  <div class="modal__panel">',
      '    <button class="modal__close" type="button" data-close-modal aria-label="Close details">' + ICONS.x + '</button>',
      '    <div class="modal__media"><img alt="" data-modal-img></div>',
      '    <div class="modal__body" data-modal-body></div>',
      '  </div>',
      '</div>',

      '<a class="float-wa" data-float-wa target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">',
      '  <span class="float-wa__icon">' + ICONS.whatsapp + '</span>',
      '  <span class="float-wa__label"><strong>Chat on WhatsApp</strong><small>Reply in minutes</small></span>',
      '</a>',

      '<button class="back-top" type="button" data-back-top aria-label="Back to top">' + ICONS.arrowUp + '</button>',

      '<div class="toast-stack" data-toasts aria-live="polite"></div>'
    ].join('');
    document.body.appendChild(chrome);

    const float = $('[data-float-wa]');
    if (float) {
      float.href = waLink('Hello ' + BUSINESS.name + ' 👋 I am on your website (' + pageTitle +
        ') and I would like to request a quotation.');
    }
  }

  function toast(message, kind) {
    const stack = $('[data-toasts]');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind === 'wa' ? ' toast--wa' : '');
    el.innerHTML = (kind === 'wa' ? ICONS.whatsapp : kind === 'cart' ? ICONS.cart : ICONS.checkCircle) +
      '<span>' + escapeHtml(message) + '</span>';
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 400);
    }, 3000);
  }

  /* ======================================================================
     C. HEADER, MOBILE NAV & SCROLL UI
     ====================================================================== */
  function initHeader() {
    const header = $('.site-header');
    const nav = $('.nav');
    const toggle = $('.menu-toggle');
    const progress = $('[data-scroll-progress] span');
    const backTop = $('[data-back-top]');

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('no-scroll', open);
      });
    }

    const overlay = $('[data-overlay]');
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeDrawer();
        closeModal();
        if (nav && nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          if (toggle) { toggle.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
          document.body.classList.remove('no-scroll');
        }
      });
    }

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle('is-stuck', y > 12);
      if (backTop) backTop.classList.toggle('is-on', y > 700);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backTop) {
      backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* generic [data-wa] / [data-tel] links declared in the HTML
       [data-wa-number] optionally routes to the secondary line */
    $$('[data-wa]').forEach((el) => {
      el.href = waLink(el.dataset.wa || MSG.general, el.dataset.waNumber);
      el.target = '_blank';
      el.rel = 'noopener';
    });
    $$('[data-tel]').forEach((el) => { el.href = 'tel:' + el.dataset.tel; });

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ======================================================================
     D. HERO SLIDESHOW — 5 interiors, 3 second refresh
     ====================================================================== */
  function initHero() {
    const hero = $('[data-hero]');
    if (!hero) return;

    const slides = $$('.hero__slide', hero);
    const dots = $$('.hero__dot', hero);
    const count = $('[data-hero-count]', hero);
    const INTERVAL = 3000;
    let index = 0;
    let timer = null;
    let onScreen = true;

    const render = (i, resetProgress) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
      dots.forEach((d, n) => {
        const active = n === index;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-selected', String(active));
        if (active && resetProgress) {
          /* restart the 3s progress animation on the active bar */
          d.style.animation = 'none';
          void d.offsetWidth;
          d.style.animation = '';
        }
      });
      if (count) count.innerHTML = '<b>' + String(index + 1).padStart(2, '0') + '</b> / ' + String(slides.length).padStart(2, '0');
    };

    const start = () => {
      stop();
      if (!onScreen || document.hidden) return;   /* phones: never rotate off-screen */
      timer = setInterval(() => render(index + 1, true), INTERVAL);
    };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };

    const goTo = (i) => { render(i, true); start(); };

    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    const prev = $('[data-hero-prev]', hero);
    const next = $('[data-hero-next]', hero);
    if (prev) prev.addEventListener('click', () => goTo(index - 1));
    if (next) next.addEventListener('click', () => goTo(index + 1));

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    /* only animate while the hero is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          onScreen = entry.isIntersecting;
          onScreen ? start() : stop();
        });
      }, { threshold: .12 }).observe(hero);
    }

    /* touch swipe */
    let startX = 0;
    hero.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) goTo(dx < 0 ? index + 1 : index - 1);
    }, { passive: true });

    /* keyboard: only while the hero itself has focus, so page scrolling is unaffected */
    hero.setAttribute('tabindex', '-1');
    hero.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    });

    render(0, true);
    start();
  }

  /* ======================================================================
     E. REVIEW CAROUSEL — batches of 3, 5 second refresh
     ====================================================================== */
  function initReviews() {
    const roots = $$('[data-reviews]');
    if (!roots.length) return;
    const INTERVAL = 5000;

    roots.forEach((root) => {
      const track = $('[data-reviews-track]', root);
      const dotsWrap = $('[data-reviews-dots]', root);
      const counter = $('[data-reviews-counter]', root);
      const progress = $('[data-reviews-progress]', root);
      const prev = $('[data-reviews-prev]', root);
      const next = $('[data-reviews-next]', root);
      if (!track) return;

      const batchSize = () => (window.innerWidth <= 900 ? 1 : 3);
      let index = 0;
      let timer = null;
      let paused = false;

      const batches = (size) => {
        const out = [];
        for (let i = 0; i < REVIEWS.length; i += size) {
          const batch = REVIEWS.slice(i, i + size);
          let k = 0;
          while (batch.length < size && REVIEWS.length > batch.length) {
            batch.push(REVIEWS[k]); k++;
          }
          out.push(batch);
        }
        return out;
      };

      const card = (r) => [
        '<article class="review-card">',
        '  <span class="review-card__quote">&#8220;</span>',
        '  <div class="review-card__head">',
        '    <span class="avatar" aria-hidden="true">' + initials(r.name) + '</span>',
        '    <div class="review-card__who"><strong>' + escapeHtml(r.name) + '</strong>',
        '      <span>' + ICONS.pin + escapeHtml(r.location) + '</span></div>',
        '  </div>',
        '  <div class="review-card__stars">' + stars(r.rating) + '<em>' + escapeHtml(r.date) + '</em></div>',
        '  <p class="review-card__text">' + escapeHtml(r.text) + '</p>',
        '  <div class="review-card__foot">',
        '    <span class="review-card__service">' + ICONS.tag + escapeHtml(r.service) + '</span>',
        '    <span class="review-card__verified">' + ICONS.checkCircle + 'Verified client</span>',
        '  </div>',
        '</article>'
      ].join('');

      const render = (i) => {
        const list = batches(batchSize());
        index = (i + list.length) % list.length;
        const batch = list[index];

        track.classList.add('is-swapping');
        window.setTimeout(() => {
          track.innerHTML = batch.map(card).join('');
          track.classList.remove('is-swapping');
          $$('.review-card', track).forEach((el, n) => el.classList.add('reveal', 'is-in'));
        }, 240);

        if (counter) counter.textContent = 'Batch ' + (index + 1) + ' of ' + list.length + ' \u00b7 ' + REVIEWS.length + ' reviews';
        if (dotsWrap) {
          if (!dotsWrap.children.length || dotsWrap.children.length !== list.length) {
            dotsWrap.innerHTML = list.map((_, n) =>
              '<button class="reviews-dot" type="button" data-dot="' + n + '" aria-label="Show reviews batch ' + (n + 1) + '"></button>').join('');
          }
          $$('.reviews-dot', dotsWrap).forEach((d, n) => d.classList.toggle('is-active', n === index));
        }
        if (progress) {
          progress.style.animation = 'none';
          void progress.offsetWidth;
          progress.style.animation = '';
        }
      };

      const start = () => {
        stop();
        if (document.hidden) return;                /* don't rotate in a background tab */
        timer = window.setInterval(() => { if (!paused) render(index + 1); }, INTERVAL);
      };
      const stop = () => { if (timer) window.clearInterval(timer); timer = null; };

      /* phones: pause the carousel entirely while it is scrolled out of view */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) { paused = false; start(); }
            else { paused = true; stop(); }
          });
        }, { threshold: .1 }).observe(root);
      }

      if (prev) prev.addEventListener('click', () => { render(index - 1); start(); });
      if (next) next.addEventListener('click', () => { render(index + 1); start(); });
      if (dotsWrap) {
        dotsWrap.addEventListener('click', (e) => {
          const dot = e.target.closest('[data-dot]');
          if (!dot) return;
          render(parseInt(dot.dataset.dot, 10)); start();
        });
      }
      root.addEventListener('mouseenter', () => { paused = true; root.classList.add('reviews-paused'); });
      root.addEventListener('mouseleave', () => { paused = false; root.classList.remove('reviews-paused'); });

      /* touch: pause while pressed, and swipe left/right to change batch */
      let touchX = 0;
      let touchY = 0;
      root.addEventListener('touchstart', (e) => {
        paused = true;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      }, { passive: true });
      root.addEventListener('touchend', (e) => {
        paused = false;
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        /* only treat it as a swipe when it is clearly horizontal */
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.6) {
          render(dx < 0 ? index + 1 : index - 1);
          start();
        }
      }, { passive: true });

      let lastSize = batchSize();
      window.addEventListener('resize', () => {
        const size = batchSize();
        if (size !== lastSize) { lastSize = size; render(0); }
      });

      render(0);
      start();
    });
  }

  /* ======================================================================
     F. CATALOGUE RENDERING, FILTERS & DETAIL MODAL
     ====================================================================== */
  function designCard(d) {
    return [
      '<article class="card reveal" data-cat="' + escapeHtml(d.category) + '">',
      '  <div class="card__media">',
      '    ' + responsiveImg(d.image, d.title + ' — ' + d.category + ' by Redefine Interiors',
        '(max-width: 620px) 92vw, (max-width: 1024px) 46vw, 380px'),
      '    <div class="card__badges">',
      (d.badge ? '      <span class="badge">' + escapeHtml(d.badge) + '</span>' : ''),
      '    </div>',
      '    <span class="card__cat">' + ICONS.spark + escapeHtml(d.category) + '</span>',
      '    <button class="card__quick" type="button" data-view="' + d.id + '">' + ICONS.image + '<span>View details</span></button>',
      '  </div>',
      '  <div class="card__body">',
      '    <h3>' + escapeHtml(d.title) + '</h3>',
      '    <p class="card__summary">' + escapeHtml(d.summary) + '</p>',
      '    <div class="chip-row card__chips">' + d.features.slice(0, 3).map((f) => '<span class="chip">' + escapeHtml(f) + '</span>').join('') + '</div>',
      '    <div class="card__meta">',
      '      <span>' + ICONS.clock + escapeHtml(d.time) + '</span>',
      '      <span>' + ICONS.ruler + 'Free site measurement</span>',
      '    </div>',
      '    <div class="card__price-row">',
      '      <div class="card__price"><em>' + d.priceNote + ' price</em><strong>' + money(d.price) + '</strong> <small>' + (d.unit || 'complete installation') + '</small></div>',
      '      <div class="card__actions">',
      '        <button class="icon-btn" type="button" data-add="design" data-id="' + d.id + '" title="Add to quotation list" aria-label="Add ' + escapeHtml(d.title) + ' to quotation list">' + ICONS.cart + '</button>',
      '        <button class="btn btn--wa btn--sm" type="button" data-wa-quote="' + d.id + '">' + ICONS.whatsapp + 'Quotation</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  /* materials are shown as designed swatch tiles (see .swatch in style.css) */
  const swatch = (key, iconName, label) =>
    '<span class="swatch swatch--' + key + '" aria-hidden="true">' +
    '<span class="swatch__icon">' + ICONS[iconName || 'box'] + '</span>' +
    (label ? '<span class="swatch__label">' + escapeHtml(label) + '</span>' : '') +
    '</span>';

  function materialCard(m) {
    const badge = m.badge ? '<span class="badge badge--ink">' + escapeHtml(m.badge) + '</span>' : '';
    const media = m.image
      ? '  <div class="card__media card__media--photo">' +
        '    ' + responsiveImg(m.image, m.name + ' supplied by Redefine Interiors Kenya',
          '(max-width: 620px) 92vw, (max-width: 1024px) 46vw, 380px') +
        '    <span class="card__cat">' + ICONS[ m.icon || 'box' ] + escapeHtml(m.category) + '</span>' +
        '  </div>'
      : '  <div class="card__media card__media--swatch">' +
        swatch(m.swatch, m.icon, m.category) +
        '  </div>';

    return [
      '<article class="card card--material reveal" data-cat="' + escapeHtml(m.category) + '">',
      media,
      '  <div class="card__badges card__badges--overlay">',
      (badge ? '    ' + badge : ''),
      '  </div>',
      '  <div class="card__body">',
      '    <h3>' + escapeHtml(m.name) + '</h3>',
      '    <p class="card__note">' + escapeHtml(m.note) + '</p>',
      '    <div class="card__price-row">',
      '      <div class="card__price"><em>Wholesale-friendly price</em><strong>' + money(m.price) + '</strong> <small>' + escapeHtml(m.unit) + '</small></div>',
      '      <div class="card__actions">',
      '        <button class="icon-btn" type="button" data-add="material" data-id="' + m.id + '" title="Add to quotation list" aria-label="Add ' + escapeHtml(m.name) + ' to quotation list">' + ICONS.cart + '</button>',
      '        <button class="btn btn--wa btn--sm" type="button" data-wa-material="' + m.id + '">' + ICONS.whatsapp + 'Quotation</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function serviceCard(s) {
    return [
      '<article class="service-card reveal">',
      '  <span class="service-card__icon">' + ICONS[SERVICE_ICON[s.slug]] + '</span>',
      '  <h3>' + escapeHtml(s.title) + '</h3>',
      '  <p>' + escapeHtml(s.text) + '</p>',
      '  <div class="service-card__foot">',
      '    <span class="service-card__price">From <b>' + money(s.from) + '</b></span>',
      '    <button class="btn btn--wa btn--sm" type="button" data-wa-service="' + s.slug + '">' + ICONS.whatsapp + 'Quote</button>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function initCatalog() {
    /* services */
    $$('[data-services]').forEach((wrap) => {
      wrap.innerHTML = SERVICES.map(serviceCard).join('');
    });

    /* designs (optional data-limit to show a preview grid) */
    $$('[data-design-grid]').forEach((grid) => {
      const limit = parseInt(grid.dataset.limit, 10);
      const list = limit ? DESIGNS.slice(0, limit) : DESIGNS;
      grid.innerHTML = list.map(designCard).join('');
    });

    /* materials */
    $$('[data-material-grid]').forEach((grid) => {
      const limit = parseInt(grid.dataset.limit, 10);
      const list = limit ? MATERIALS.slice(0, limit) : MATERIALS;
      grid.innerHTML = list.map(materialCard).join('');
    });

    /* full price list table */
    $$('[data-price-list]').forEach((tbody) => {
      const rows = MATERIALS.map((m) => ({ name: m.name, unit: m.unit, price: m.price, category: m.category, image: m.image })).concat(PRICE_LIST);
      rows.sort((a, b) => a.category.localeCompare(b.category) || a.price - b.price);
      tbody.innerHTML = rows.map((r) => [
        '<tr>',
        '  <td class="price-table__photo">' + (r.image
          ? '<img src="' + sized(r.image, 480) + '" alt="' + escapeHtml(r.name) + '" width="56" height="56" loading="lazy" decoding="async">'
          : '<span class="price-table__icon" title="Photo on request" aria-hidden="true">' +
            ICONS[CATEGORY_ICON[r.category] || 'box'] + '</span>') + '</td>',
        '  <td>' + escapeHtml(r.name) + '</td>',
        '  <td>' + escapeHtml(r.category) + '</td>',
        '  <td>' + escapeHtml(r.unit) + '</td>',
        '  <td><strong>' + money(r.price) + '</strong></td>',
        '  <td><button class="btn btn--wa btn--sm" type="button" data-wa-inline="' + escapeHtml(r.name) + '|' + escapeHtml(r.unit) + '|' + r.price + '">' + ICONS.whatsapp + 'Quote</button></td>',
        '</tr>'
      ].join('')).join('');
    });

    /* service coverage areas */
    $$('[data-areas]').forEach((wrap) => {
      wrap.innerHTML = AREAS.map((a) => '<span>' + escapeHtml(a) + '</span>').join('');
    });

    /* filters */
    $$('[data-filters]').forEach((bar) => {
      const targetSel = bar.dataset.filters;
      const all = bar.dataset.allLabel || 'All';
      const cards = $$(targetSel + ' > article');
      const cats = [];
      cards.forEach((c) => { if (!cats.includes(c.dataset.cat)) cats.push(c.dataset.cat); });

      bar.innerHTML = [all].concat(cats).map((cat, i) => {
        const n = cat === all ? cards.length : cards.filter((c) => c.dataset.cat === cat).length;
        return '<button class="filter' + (i === 0 ? ' is-active' : '') + '" type="button" data-filter="' + cat + '">' +
          escapeHtml(cat) + '<span class="filter__count">' + n + '</span></button>';
      }).join('');

      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter]');
        if (!btn) return;
        const cat = btn.dataset.filter;
        $$('.filter', bar).forEach((b) => b.classList.toggle('is-active', b === btn));
        cards.forEach((c) => {
          const show = cat === all || c.dataset.cat === cat;
          c.style.display = show ? '' : 'none';
        });
        const visible = cards.filter((c) => c.style.display !== 'none');
        let empty = $('.empty-state', bar.parentElement);
        if (!visible.length) {
          if (!empty) {
            empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'Nothing in this category yet — message us on WhatsApp and we will send options and prices.';
            $(targetSel).appendChild(empty);
          }
        } else if (empty) {
          empty.remove();
        }
      });
    });

    /* global delegated clicks */
    document.addEventListener('click', (e) => {
      const waDesign = e.target.closest('[data-wa-quote]');
      if (waDesign) {
        const d = DESIGNS.find((x) => x.id === waDesign.dataset.waQuote);
        if (d) openWa(MSG.design(d));
        return;
      }
      const waMaterial = e.target.closest('[data-wa-material]');
      if (waMaterial) {
        const m = MATERIALS.find((x) => x.id === waMaterial.dataset.waMaterial);
        if (m) openWa(MSG.material(m));
        return;
      }
      const waService = e.target.closest('[data-wa-service]');
      if (waService) {
        const s = SERVICES.find((x) => x.slug === waService.dataset.waService);
        if (s) openWa(MSG.service(s));
        return;
      }
      const waInline = e.target.closest('[data-wa-inline]');
      if (waInline) {
        const parts = waInline.dataset.waInline.split('|');
        openWa('Hello ' + BUSINESS.name + ' 👋\n\nI would like to request a quotation for:\n\n*' + parts[0] + '*\nPrice guide: ' + money(parts[2]) + ' ' + parts[1] +
          '\n\nQuantity needed: ______\nDelivery location: ______\n\nPlease confirm availability and the total cost. Thank you!');
        return;
      }

      const add = e.target.closest('[data-add]');
      if (add) { addToQuote(add.dataset.add, add.dataset.id, add); return; }

      const view = e.target.closest('[data-view]');
      if (view) { openModal(view.dataset.view); return; }
      const openDrawerBtn = e.target.closest('[data-open-drawer]');
      if (openDrawerBtn) { openDrawer(); return; }
      if (e.target.closest('[data-close-drawer]')) { closeDrawer(); return; }
      if (e.target.closest('[data-close-modal]')) { closeModal(); return; }

      /* clicking a card (not a button) opens details */
      const cardEl = e.target.closest('.card');
      if (cardEl && !e.target.closest('button') && !e.target.closest('a')) {
        const id = $('[data-view]', cardEl);
        if (id) openModal(id.dataset.view);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeDrawer(); closeModal(); }
    });
  }

  /* ---- detail modal ----------------------------------------------------- */
  function openModal(id) {
    const d = DESIGNS.find((x) => x.id === id);
    const modal = $('[data-modal]');
    if (!d || !modal) return;

    const modalImg = $('[data-modal-img]', modal);
    modalImg.src = d.image;
    modalImg.srcset = [480, 760, FULL_WIDTH(d.image)]
      .map((w) => (w === FULL_WIDTH(d.image) ? d.image : sized(d.image, w)) + ' ' + w + 'w').join(', ');
    modalImg.sizes = '(max-width: 900px) 92vw, 620px';
    modalImg.alt = d.title + ' — ' + d.category;
    $('[data-modal-body]', modal).innerHTML = [
      '<span class="eyebrow">' + escapeHtml(d.category) + '</span>',
      '<h3>' + escapeHtml(d.title) + '</h3>',
      '<p class="muted" style="font-size:.92rem">' + escapeHtml(d.summary) + '</p>',
      '<div class="modal__price"><strong>' + money(d.price) + '</strong><span>' + d.priceNote + ' · ' + (d.unit || 'supplied &amp; installed') + '</span></div>',
      '<div class="chip-row">',
      '  <span class="chip">' + ICONS.clock + escapeHtml(d.time) + '</span>',
      '  <span class="chip">' + ICONS.shield + '1 year workmanship guarantee</span>',
      '  <span class="chip">' + ICONS.truck + 'Site delivery in Kenya</span>',
      '</div>',
      '<h4 class="display-s" style="margin-top:1.4rem">What is included</h4>',
      '<ul class="modal__list">' + d.features.map((f) => '<li>' + ICONS.check + escapeHtml(f) + '</li>').join('') + '</ul>',
      '<h4 class="display-s" style="margin-top:.4rem">Materials used</h4>',
      '<div class="chip-row">' + d.materials.map((m) => '<span class="chip">' + ICONS.box + escapeHtml(m) + '</span>').join('') + '</div>',
      '<div class="modal__actions">',
      '  <button class="btn btn--wa" type="button" data-wa-quote="' + d.id + '">' + ICONS.whatsapp + 'Request quotation</button>',
      '  <button class="btn btn--light" type="button" data-add="design" data-id="' + d.id + '">' + ICONS.cart + 'Add to list</button>',
      '</div>',
      '<p class="modal__note">Indicative pricing. Send your measurements or request a free site visit for an exact quotation — we serve all parts of Kenya.</p>'
    ].join('');

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const ov = $('[data-overlay]');
    if (ov) ov.classList.add('is-open');
  }

  function closeModal() {
    const modal = $('[data-modal]');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!$('.drawer.is-open')) document.body.classList.remove('no-scroll');
    const ov = $('[data-overlay]');
    if (ov && !$('.drawer.is-open')) ov.classList.remove('is-open');
  }

  /* ======================================================================
     G. QUOTATION LIST (persisted in localStorage)
     ====================================================================== */
  const STORE_KEY = 'redefine_quote_v1';
  let quote = [];

  function loadQuote() {
    try { quote = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { quote = []; }
    if (!Array.isArray(quote)) quote = [];
  }
  function saveQuote() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(quote)); } catch (e) { /* storage blocked */ }
  }
  function findItem(type, id) {
    return type === 'design' ? DESIGNS.find((x) => x.id === id) : MATERIALS.find((x) => x.id === id);
  }

  function addToQuote(type, id, btn) {
    const item = findItem(type, id);
    if (!item) return;
    const existing = quote.find((q) => q.type === type && q.id === id);
    if (existing) { existing.qty += 1; } else { quote.push({ type: type, id: id, qty: 1 }); }
    saveQuote();
    if (btn) {
      btn.classList.add('is-added');
      window.setTimeout(() => btn.classList.remove('is-added'), 1200);
    }
    renderQuote();
    toast('Added to your quotation list', 'cart');
  }

  function removeFromQuote(type, id) {
    quote = quote.filter((q) => !(q.type === type && q.id === id));
    saveQuote();
    renderQuote();
  }

  function setQty(type, id, delta) {
    const row = quote.find((q) => q.type === type && q.id === id);
    if (!row) return;
    row.qty = Math.max(1, Math.min(99, row.qty + delta));
    saveQuote();
    renderQuote();
  }

  function quoteTotal() {
    return quote.reduce((sum, row) => {
      const item = findItem(row.type, row.id);
      return sum + (item ? item.price * row.qty : 0);
    }, 0);
  }

  function renderQuote() {
    const body = $('[data-quote-body]');
    const total = $('[data-quote-total]');
    const summary = $('[data-quote-summary]');
    if (!body) return;

    if (!quote.length) {
      body.innerHTML = '<div class="drawer__empty">' + ICONS.cart +
        '<strong>Your list is empty</strong><p>Tap the trolley icon on any design or material to build a quotation request, then send it to us on WhatsApp in one message.</p></div>';
    } else {
      body.innerHTML = quote.map((row) => {
        const item = findItem(row.type, row.id);
        if (!item) return '';
        const title = item.title || item.name;
        const unit = item.unit || 'complete installation';
        const thumb = item.image
          ? '<div class="quote-item__thumb"><img src="' + item.image + '" alt="' + escapeHtml(title) + '" loading="lazy"></div>'
          : '<div class="quote-item__thumb quote-item__thumb--swatch">' + swatch(item.swatch, item.icon) + '</div>';
        return [
          '<div class="quote-item">',
          '  ' + thumb,
          '  <div class="quote-item__body">',
          '    <strong>' + escapeHtml(title) + '</strong>',
          '    <small>' + escapeHtml(item.category) + ' · ' + escapeHtml(unit) + '</small>',
          '    <div class="quote-item__price">' + money(item.price * row.qty) + ' <em>(' + money(item.price) + ' × ' + row.qty + ')</em></div>',
          '  </div>',
          '  <div class="quote-item__side">',
          '    <button class="quote-item__remove" type="button" data-remove="' + row.type + ':' + row.id + '" aria-label="Remove ' + escapeHtml(title) + '">' + ICONS.trash + '</button>',
          '    <span class="qty qty--sm">',
          '      <button type="button" data-qty="' + row.type + ':' + row.id + ':-1" aria-label="Decrease quantity">' + ICONS.minus + '</button>',
          '      <input type="text" value="' + row.qty + '" readonly aria-label="Quantity">',
          '      <button type="button" data-qty="' + row.type + ':' + row.id + ':1" aria-label="Increase quantity">' + ICONS.plus + '</button>',
          '    </span>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    }

    const count = quote.reduce((n, r) => n + r.qty, 0);
    if (summary) summary.textContent = count ? count + ' item' + (count > 1 ? 's' : '') + ' selected' : 'No items yet';
    if (total) total.textContent = money(quoteTotal());

    $$('[data-quote-count]').forEach((el) => {
      el.textContent = String(count);
      el.classList.toggle('is-on', count > 0);
    });
    const mobileCount = $('.mobile-bar__count');
    if (mobileCount) {
      mobileCount.textContent = String(count);
      mobileCount.style.display = count ? 'grid' : 'none';
    }
  }

  function quoteMessage() {
    const lines = quote.map((row, i) => {
      const item = findItem(row.type, row.id);
      if (!item) return '';
      const title = item.title || item.name;
      const unit = item.unit || 'complete installation';
      return (i + 1) + '. *' + title + '* — ' + money(item.price) + ' ' + unit + ' × ' + row.qty + ' = ' + money(item.price * row.qty);
    }).filter(Boolean);

    return 'Hello ' + BUSINESS.name + ' 👋\n\nI would like to request a quotation for the following:\n\n' +
      lines.join('\n') +
      '\n\nEstimated total: ' + money(quoteTotal()) +
      '\n\nMy name: ______\nMy location: ______\nPreferred start date: ______\n\nPlease confirm availability and the exact cost. Thank you!';
  }

  function openDrawer() {
    const drawer = $('.drawer');
    const ov = $('[data-overlay]');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (ov) ov.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }
  function closeDrawer() {
    const drawer = $('.drawer');
    const ov = $('[data-overlay]');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (!$('.modal.is-open')) document.body.classList.remove('no-scroll');
    if (ov && !$('.modal.is-open')) ov.classList.remove('is-open');
  }

  function initQuote() {
    loadQuote();
    renderQuote();

    document.addEventListener('click', (e) => {
      const remove = e.target.closest('[data-remove]');
      if (remove) {
        const parts = remove.dataset.remove.split(':');
        removeFromQuote(parts[0], parts[1]);
        return;
      }
      const qty = e.target.closest('[data-qty]');
      if (qty) {
        const parts = qty.dataset.qty.split(':');
        setQty(parts[0], parts[1], parseInt(parts[2], 10));
        return;
      }
      if (e.target.closest('[data-quote-send]')) {
        if (!quote.length) { toast('Add a design or material first'); return; }
        openWa(quoteMessage());
        toast('Opening WhatsApp with your list…', 'wa');
        return;
      }
      if (e.target.closest('[data-quote-clear]')) {
        if (!quote.length) return;
        quote = [];
        saveQuote();
        renderQuote();
        toast('Quotation list cleared');
      }
    });
  }

  /* ======================================================================
     H. FAQ, FORMS, COUNTERS & REVEAL ANIMATIONS
     ====================================================================== */
  function initFaq() {
    $$('.faq__item').forEach((item) => {
      const btn = $('.faq__q', item);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        $$('.faq__item').forEach((other) => {
          other.classList.remove('is-open');
          const b = $('.faq__q', other);
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function initForms() {
    $$('[data-quote-form]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        const required = $$('[required]', form);

        required.forEach((input) => {
          const field = input.closest('.field');
          const err = field ? $('.field__error', field) : null;
          let message = '';
          const value = input.value.trim();
          if (!value) {
            message = 'This field is required';
          } else if (input.type === 'tel' && !/^[0-9+\s()-]{7,}$/.test(value)) {
            message = 'Enter a valid phone number';
          }
          if (field) field.classList.toggle('has-error', Boolean(message));
          if (err) err.textContent = message;
          if (message) valid = false;
        });

        if (!valid) {
          const firstError = $('.has-error input, .has-error select, .has-error textarea', form);
          if (firstError) firstError.focus();
          toast('Please check the highlighted fields');
          return;
        }

        const data = new FormData(form);
        const get = (k) => (data.get(k) || '').toString().trim();
        const message = [
          'Hello ' + BUSINESS.name + ' 👋',
          '',
          '*New quotation request from the website*',
          '',
          'Name: ' + get('name'),
          'Phone: ' + get('phone'),
          'Location: ' + get('location'),
          'Service needed: ' + get('service'),
          get('budget') ? 'Budget range: ' + get('budget') : '',
          get('timeline') ? 'Timeline: ' + get('timeline') : '',
          '',
          'Details:',
          get('details') || '(no extra details provided)',
          '',
          'Please send me a quotation. Thank you!'
        ].filter((line) => line !== '').join('\n');

        openWa(message);
        const note = $('[data-form-note]', form);
        if (note) {
          note.hidden = false;
          note.textContent = 'Thank you, ' + get('name').split(' ')[0] + '! WhatsApp should now be open with your request ready to send.';
        }
        toast('Opening WhatsApp with your request…', 'wa');
        form.reset();
      });
    });

    $$('input, select, textarea').forEach((input) => {
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && field.classList.contains('has-error')) {
          field.classList.remove('has-error');
          const err = $('.field__error', field);
          if (err) err.textContent = '';
        }
      });
    });
  }

  /* replaces <span class="i" data-icon="name"></span> with the SVG icon */
  function hydrateIcons() {
    $$('[data-icon]').forEach((el) => {
      const name = el.dataset.icon;
      if (ICONS[name]) el.innerHTML = ICONS[name];
    });
  }

  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) {
      nums.forEach((n) => { n.textContent = n.dataset.count; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        const start = performance.now();
        const decimals = Number.isInteger(target) ? 0 : 1;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = target * eased;
          el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-KE')) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: .4 });
    nums.forEach((n) => io.observe(n));
  }

  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = Array.prototype.slice.call(entry.target.parentElement.children);
        const i = siblings.indexOf(entry.target);
        entry.target.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* re-run reveal for content injected later (grids, reviews) */
  const revealObserverFor = (nodes) => {
    nodes.forEach((el) => el.classList.add('is-in'));
  };

  /* ======================================================================
     BOOT
     ====================================================================== */
  function boot() {
    hydrateIcons();
    buildChrome();
    hydrateIcons();
    initHeader();
    initCatalog();
    initQuote();
    initHero();
    initReviews();
    initFaq();
    initForms();
    initCounters();
    initReveal();
    revealObserverFor($$('.drawer, .modal'));
    document.body.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
