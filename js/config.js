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

    /* --- built-in administrator account ----------------------------------
       These credentials ALWAYS open the admin bar, even before the Supabase
       account exists and even when the database is unreachable. On the way in
       the site still tries Supabase first: if an auth user with this phone
       number (or the e-mail below) and this password exists, you get the full
       cloud session and every change is published live. If it does not exist
       yet, the site signs you in "on this device only" and stores your edits
       in the browser (see js/store.js) until the Supabase account is created.

       passwordHash = sha256('redefine-interiors::2026::' + password)
       passwordB64  = the same password in base64, used only on browsers
                      without crypto.subtle (plain http / very old engines).

       To change the password:  node -e "console.log(require('crypto')
         .createHash('sha256').update('redefine-interiors::2026::NEWPW')
         .digest('hex'))"   … and paste the result below.                       */
    defaultAdmin: {
      phone: '0703142874',
      phoneE164: '+254703142874',
      email: '',                                   // optional: e-mail of the same account
      fullName: 'Redefine administrator',
      role: 'owner',
      passwordHash: '1c342ffceb3d4d056981c1139a284b8ee6d9143b65ad7403fecc3e965b442579',
      passwordB64: 'UmVkZWZpbmUyMDI2Iw==',
      prefilled: true                              // show the credentials in the sign-in form
    },

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
