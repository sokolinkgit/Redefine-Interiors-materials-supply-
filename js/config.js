/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — SITE CONFIG + SUPABASE CLIENT
   --------------------------------------------------------------------------
   The anon key below is PUBLIC by design (it ships to every browser). It can
   only read content that Row Level Security allows; every write is rejected
   unless the signed-in user is listed in public.admins.

   Never put the service_role key in this file.
   ========================================================================== */
(function () {
  'use strict';

  window.SITE_CONFIG = {
    /* --- Supabase project ------------------------------------------------ */
    supabaseUrl: 'https://rzdfmnvkhfuhqybfexuy.supabase.co',
    supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGZtbnZraGZ1aHF5YmZleHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjkzNTYsImV4cCI6MjEwNTQwNTM1Nn0.5G2d4hcoA6hw9xsdCZAJj6gxhUKJIwD6s55Pd0e_KmM',

    /* --- storage --------------------------------------------------------- */
    mediaBucket: 'site-media',

    /* --- switches -------------------------------------------------------- */
    cms: true,          // read content from Supabase (falls back to js/data.js)
    admin: true,        // allow the ghost-mode admin overlay
    realtime: true,     // refresh when content changes on another device

    /* --- ghost mode ------------------------------------------------------ */
    /* five taps/clicks on the top-left logo + name inside one minute */
    ghost: { taps: 5, windowMs: 60000 },

    /* --- uploads --------------------------------------------------------- */
    upload: {
      maxBytes: 8 * 1024 * 1024,   // must match the bucket's file_size_limit
      maxWidth: 1600,              // full-size rendition
      widths: [1600, 760, 480],    // full / tablet / phone renditions
      quality: 0.86
    },

    /* --- network --------------------------------------------------------- */
    contentTimeoutMs: 8000         // give up and keep the built-in content
  };

  /* Create the client once, as early as possible. `detectSessionInUrl:false`
     keeps Supabase from touching the URL hash on a plain marketing site.     */
  if (window.supabase && window.supabase.createClient) {
    window.SiteSupabase = window.supabase.createClient(
      window.SITE_CONFIG.supabaseUrl,
      window.SITE_CONFIG.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'redefine-admin-session'
        }
      }
    );
  } else {
    window.SiteSupabase = null;
    if (window.console) {
      console.info('[redefine] supabase-js did not load — the site keeps using js/data.js.');
    }
  }
})();
