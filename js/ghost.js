/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — GHOST MODE
   --------------------------------------------------------------------------
   The whole admin entry point: five taps or clicks on the top-left logo +
   name inside one minute. There is no link, no /admin page and no visible
   hint anywhere on the site — this file simply counts.

   The admin interface itself (js/admin.js) is only downloaded when it is
   actually needed, so visitors never pay for it:
     • the gesture completes            → load admin.js → show the sign-in
     • a Supabase session already exists → load admin.js → resume silently

   The built-in account in js/config.js works even when supabase-js never
   loaded, so the gesture is honoured as long as admin mode is switched on.
   ========================================================================== */
(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const sb = window.SiteSupabase;
  if (!cfg.admin) return;

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  const TAPS = (cfg.ghost && cfg.ghost.taps) || 5;
  const WINDOW_MS = (cfg.ghost && cfg.ghost.windowMs) || 60000;
  const KEY = 'redefine_ghost_v1';

  /* ------------------------------------------------------- admin.js loader */
  let loading = null;
  function loadAdmin() {
    if (window.SiteAdmin) return Promise.resolve(window.SiteAdmin);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'js/admin.js?v=20260924b';
      s.async = true;
      s.onload = () => (window.SiteAdmin ? resolve(window.SiteAdmin) : reject(new Error('admin.js did not register')));
      s.onerror = () => { loading = null; reject(new Error('admin.js could not be downloaded')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  /* ------------------------------------------------------------ tap counter
     Kept in sessionStorage so the gesture survives the one navigation the
     logo link causes (every page's logo points at the home page, `/`).              */
  function readTaps() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function writeTaps(list) {
    try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
  }

  async function openAdmin() {
    try {
      const admin = await loadAdmin();
      if (!admin) return;
      if (admin.isActive && admin.isActive()) admin.openBar();
      else admin.openLogin();
    } catch (err) {
      if (window.console) console.warn('[redefine] admin overlay unavailable —', err.message);
    }
  }

  function onBrandClick(brand) {
    return function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const now = Date.now();
      const taps = readTaps().filter((t) => now - t < WINDOW_MS);
      taps.push(now);
      writeTaps(taps);

      const samePage = (() => {
        try {
          const target = new URL(brand.getAttribute('href') || '/', location.href);
          return target.pathname === location.pathname;
        } catch (err) { return false; }
      })();

      if (taps.length >= TAPS) {
        e.preventDefault();
        e.stopPropagation();
        writeTaps([]);
        openAdmin();
        return;
      }
      /* from the third tap the logo stops navigating (or reloading), so the
         gesture can be finished without the page jumping away */
      if (taps.length >= 3 || (taps.length >= 2 && samePage)) e.preventDefault();
    };
  }

  function attach() {
    const brand = $('.site-header .brand') || $('.brand');
    if (!brand || brand.__ghostBound) return;
    brand.__ghostBound = true;
    /* capture phase: we decide about navigation before the browser does */
    brand.addEventListener('click', onBrandClick(brand), true);
  }

  /* ------------------------------------------- already signed in? resume */
  async function resume() {
    let has = false;
    /* the built-in account: remembered on this device for a few hours */
    try { has = !!(window.SiteStore && window.SiteStore.sessionAlive && window.SiteStore.sessionAlive()); } catch (e) { has = false; }
    if (!has && sb) {
      try {
        const { data } = await sb.auth.getSession();
        has = !!(data && data.session);
      } catch (err) { has = false; }
    }
    if (!has) return;
    try {
      const admin = await loadAdmin();
      if (admin && admin.resume) admin.resume();
    } catch (err) { /* no session, no admin */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();

  resume();

  window.SiteGhost = { open: openAdmin, loadAdmin: loadAdmin, reset: () => writeTaps([]) };
})();
