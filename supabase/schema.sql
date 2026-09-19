-- =====================================================================================
--  REDEFINE INTERIORS & MATERIALS SUPPLY — COMPLETE SUPABASE DATABASE
--  -----------------------------------------------------------------------------------
--  Project ref : rzdfmnvkhfuhqybfexuy
--  Project URL : https://rzdfmnvkhfuhqybfexuy.supabase.co
--  Anon key    : embedded in the website (js/config.js) — the anon key is public by
--                design; every write below is blocked by Row Level Security unless the
--                caller is an approved administrator.
--
--  HOW TO RUN
--    1. Supabase Studio  →  SQL Editor  →  "New query"
--    2. Paste this whole file  →  Run  (it is idempotent — safe to run again)
--    3. Authentication → Users → "Add user" → your email + password, tick
--       "Auto Confirm User" → Create.
--       • The FIRST account you create is promoted to admin automatically.
--       • Any later account must be promoted once, from the SQL Editor:
--             select public.grant_admin('you@example.com');
--         (or by phone:  select public.grant_admin('+254703142874'); )
--    4. Open the website → tap/click the logo + name at the TOP LEFT five times
--       within one minute → the admin sign-in appears → sign in with the email OR the
--       phone number of that account plus its password.
--
--  WHAT THIS FILE CREATES
--    §1  helper functions (updated_at, is_admin)
--    §2  public.admins          — which auth.users are allowed to edit the site
--    §3  public.hero_slides     — homepage slideshow images
--    §4  public.designs         — Designs page (+ homepage featured designs)
--    §5  public.materials       — Materials page (+ homepage featured materials)
--    §6  public.services        — Services cards AND the six services.html blocks
--    §7  Row Level Security     — everyone reads, only admins write
--    §8  Storage bucket         — "site-media" for every uploaded photo
--    §9  Realtime, grants, indexes
--    §10 Seed                   — today's live content, so the site looks identical
--    §11 Checks                 — copy/paste verification queries
-- =====================================================================================

-- =====================================================================================
-- §1  EXTENSIONS & HELPERS
-- =====================================================================================
create extension if not exists pgcrypto with schema extensions;

-- keep updated_at honest on every table
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- who is editing? (uuid of the signed-in user, or null for visitors)
-- auth.uid() is provided by Supabase.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and a.is_active
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- =====================================================================================
-- §2  ADMINS — the bridge between Supabase Auth and the website
-- =====================================================================================
-- A row here means "this auth.users account may edit the website".
-- Sign-in itself always happens in Supabase Auth (email OR phone + password).
create table if not exists public.admins (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text,
  phone          text,
  full_name      text,
  role           text not null default 'admin'
                 check (role in ('owner', 'admin', 'editor')),
  is_active      boolean not null default false,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.admins is
  'Auth users allowed to edit website content. Add via public.grant_admin() or create the first user in the dashboard.';

drop trigger if exists admins_touch_updated_at on public.admins;
create trigger admins_touch_updated_at
  before update on public.admins
  for each row execute function public.touch_updated_at();

alter table public.admins enable row level security;

drop policy if exists "admins: read own row" on public.admins;
create policy "admins: read own row"
  on public.admins for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admins: owner manages admins" on public.admins;
create policy "admins: owner manages admins"
  on public.admins for all
  to authenticated
  using (
    exists (select 1 from public.admins o
             where o.id = auth.uid() and o.is_active and o.role = 'owner')
  )
  with check (
    exists (select 1 from public.admins o
             where o.id = auth.uid() and o.is_active and o.role = 'owner')
  );

-- ---- the signed-in admin profile, used by the website after login ------------------
create or replace function public.current_admin()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    to_jsonb(t),
    'null'::jsonb
  )
  from (
    select a.id, a.email, a.phone, a.full_name, a.role, a.last_login_at
    from public.admins a
    where a.id = auth.uid()
      and a.is_active
  ) t;
$$;

revoke all on function public.current_admin() from public;
grant execute on function public.current_admin() to anon, authenticated, service_role;

-- ---- stamp the login time (called once by the website after a successful sign-in) ---
create or replace function public.admin_touch_login()
returns void
language sql
security definer
set search_path = public
as $$
  update public.admins
     set last_login_at = now()
   where id = auth.uid()
     and is_active;
$$;

revoke all on function public.admin_touch_login() from public;
grant execute on function public.admin_touch_login() to authenticated, service_role;

-- ---- "I typed my phone number, but my account was created with an email" ------------
-- Returns the e-mail of an ACTIVE admin whose phone matches the digits given, so the
-- sign-in form can retry with the e-mail. Returns null for everybody else.
create or replace function public.resolve_admin_email(p_phone text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select a.email
  from public.admins a
  where a.is_active
    and a.email is not null
    and p_phone is not null
    and length(regexp_replace(p_phone, '\D', '', 'g')) >= 9
    and regexp_replace(coalesce(a.phone, ''), '\D', '', 'g')
        = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;
$$;

revoke all on function public.resolve_admin_email(text) from public;
grant execute on function public.resolve_admin_email(text) to anon, authenticated, service_role;

-- ---- promote / demote from the SQL Editor (owner only) ------------------------------
create or replace function public.grant_admin(
  p_identifier text,
  p_role       text default 'admin',
  p_full_name  text default null
)
returns public.admins
language plpgsql
security definer
set search_path = public
as $$
declare
  u    auth.users;
  out  public.admins;
begin
  if current_user not in ('postgres', 'supabase_admin')
     and auth.role() is distinct from 'service_role' then
    raise exception 'grant_admin() may only be run from the SQL Editor or with the service_role key';
  end if;

  select *
    into u
  from auth.users
  where lower(email) = lower(trim(p_identifier))
     or phone = trim(p_identifier)
     or phone = '+' || regexp_replace(trim(p_identifier), '^\+', '')
     or regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        = regexp_replace(coalesce(p_identifier, ''), '\D', '', 'g')
  limit 1;

  if u.id is null then
    raise exception 'No Supabase Auth user found for "%". Create the user first (Authentication → Users → Add user).', p_identifier;
  end if;

  insert into public.admins (id, email, phone, full_name, role, is_active)
  values (
    u.id,
    u.email,
    u.phone,
    coalesce(p_full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    p_role,
    true
  )
  on conflict (id) do update
     set email     = excluded.email,
         phone     = excluded.phone,
         full_name = coalesce(excluded.full_name, public.admins.full_name),
         role      = excluded.role,
         is_active = true
  returning * into out;

  return out;
end;
$$;

revoke all on function public.grant_admin(text, text, text) from public;
grant execute on function public.grant_admin(text, text, text) to postgres, service_role;

create or replace function public.revoke_admin(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user not in ('postgres', 'supabase_admin')
     and auth.role() is distinct from 'service_role' then
    raise exception 'revoke_admin() may only be run from the SQL Editor or with the service_role key';
  end if;

  update public.admins a
     set is_active = false
   where a.email = p_identifier
      or a.id::text = p_identifier
      or regexp_replace(coalesce(a.phone, ''), '\D', '', 'g')
         = regexp_replace(coalesce(p_identifier, ''), '\D', '', 'g');

  if not found then
    raise notice 'No admin row matched "%".', p_identifier;
  end if;
end;
$$;

revoke all on function public.revoke_admin(text) from public;
grant execute on function public.revoke_admin(text) to postgres, service_role;

-- ---- keep public.admins in sync with Supabase Auth ----------------------------------
-- The very first account created in the project becomes an ACTIVE owner automatically.
-- Every later account is inserted inactive, so a stranger signing up can never edit the
-- site until an owner runs  select public.grant_admin('their@email');
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_admin boolean;
begin
  select not exists (select 1 from public.admins) into first_admin;

  insert into public.admins (id, email, phone, full_name, role, is_active)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when first_admin then 'owner' else 'admin' end,
    first_admin
  )
  on conflict (id) do update
     set email = excluded.email,
         phone = excluded.phone;

  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admins a
     set email = new.email,
         phone = new.phone
   where a.id = new.id;
  return new;
end;
$$;

-- Triggers on auth.users need the right to be created; if your project refuses them the
-- script still succeeds and you simply promote admins with public.grant_admin().
do $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_auth_user_created();

  drop trigger if exists on_auth_user_updated on auth.users;
  create trigger on_auth_user_updated
    after update of email, phone on auth.users
    for each row execute function public.handle_auth_user_updated();

  raise notice 'Auth triggers installed — the first user you create becomes the owner.';
exception when others then
  raise notice 'Could not install auth triggers (%). After creating your user run:  select public.grant_admin(''you@example.com'');', sqlerrm;
end;
$$;

-- =====================================================================================
-- §3  HERO SLIDES — the homepage slideshow
-- =====================================================================================
create table if not exists public.hero_slides (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,
  label          text not null default '',
  image_url      text not null default '',
  image_url_760  text not null default '',
  image_url_480  text not null default '',
  image_alt      text not null default '',
  position       integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  check (image_url <> '' or image_url_760 <> '' or image_url_480 <> '')
);

comment on table  public.hero_slides             is 'Homepage slideshow: one row per rotating photo, ordered by position.';
comment on column public.hero_slides.image_url   is 'Full-size photo (public URL from the site-media bucket, or any https URL).';
comment on column public.hero_slides.image_url_760 is 'Optional 760px cut for tablets/retina phones.';
comment on column public.hero_slides.image_url_480 is 'Optional 480px cut for phones.';
comment on column public.hero_slides.is_active   is 'false = hidden from visitors, still visible to admins.';

drop trigger if exists hero_slides_touch_updated_at on public.hero_slides;
create trigger hero_slides_touch_updated_at
  before update on public.hero_slides
  for each row execute function public.touch_updated_at();

-- =====================================================================================
-- §4  DESIGNS — designs.html + the featured grid on the homepage
-- =====================================================================================
create table if not exists public.designs (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  title          text not null,
  category       text not null default 'Kitchen Cabinets',
  image_url      text not null default '',
  image_url_760  text not null default '',
  image_url_480  text not null default '',
  image_alt      text not null default '',
  badge          text not null default '',
  lead_time      text not null default '',
  unit           text not null default '',
  summary        text not null default '',
  features       jsonb not null default '[]'::jsonb,
  materials      jsonb not null default '[]'::jsonb,
  position       integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  check (jsonb_typeof(features)  = 'array'),
  check (jsonb_typeof(materials) = 'array'),
  check (title <> '')
);

comment on table  public.designs            is 'Design portfolio cards. features/materials are arrays of short strings.';
comment on column public.designs.code       is 'Stable public reference (d01, d02 …) used by the quotation list.';
comment on column public.designs.lead_time  is 'Shown on the card, e.g. "2 – 3 weeks".';
comment on column public.designs.unit       is 'Optional scope note, e.g. "per sqm".';
comment on column public.designs.badge      is 'Optional corner badge, e.g. "Best seller". Empty = no badge.';

drop trigger if exists designs_touch_updated_at on public.designs;
create trigger designs_touch_updated_at
  before update on public.designs
  for each row execute function public.touch_updated_at();

-- =====================================================================================
-- §5  MATERIALS — materials.html + the featured grid on the homepage
-- =====================================================================================
create table if not exists public.materials (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  category       text not null default 'Boards & Panels',
  image_url      text not null default '',
  image_url_760  text not null default '',
  image_url_480  text not null default '',
  image_alt      text not null default '',
  swatch         text not null default 'mdf',
  icon           text not null default 'box',
  unit           text not null default '',
  badge          text not null default '',
  note           text not null default '',
  position       integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  check (name <> ''),
  check (swatch in ('mdf','laminate','hardware','steel','gypsum','aluminium','tile','fluted','quartz','led'))
);

comment on table  public.materials        is 'Material catalogue cards.';
comment on column public.materials.swatch is 'Fallback artwork used when no photo is set (see .swatch--* in css/style.css).';
comment on column public.materials.icon   is 'Icon key from js/main.js ICONS (box, palette, wrench, layers, window, layers2, spark, bulb).';

drop trigger if exists materials_touch_updated_at on public.materials;
create trigger materials_touch_updated_at
  before update on public.materials
  for each row execute function public.touch_updated_at();

-- =====================================================================================
-- §6  SERVICES — the service cards everywhere AND the six blocks on services.html
-- =====================================================================================
create table if not exists public.services (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  icon           text not null default 'spark',
  image_url      text not null default '',
  image_url_760  text not null default '',
  image_url_480  text not null default '',
  image_alt      text not null default '',
  card_text      text not null default '',
  eyebrow        text not null default '',
  block_title    text not null default '',
  body           text not null default '',
  meta           jsonb not null default '[]'::jsonb,
  bullets        jsonb not null default '[]'::jsonb,
  cta_label      text not null default '',
  link_label     text not null default '',
  link_href      text not null default '',
  position       integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  check (jsonb_typeof(meta)    = 'array'),
  check (jsonb_typeof(bullets) = 'array'),
  check (title <> ''),
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table  public.services             is 'The six core services: card copy (title/card_text/image) plus the long services.html block.';
comment on column public.services.card_text   is 'Short line used on the card (home page, grids).';
comment on column public.services.eyebrow     is 'Small label above the block heading, e.g. "01 · Kitchens".';
comment on column public.services.block_title is 'Heading of the services.html block, e.g. "Kitchen cabinets".';
comment on column public.services.body        is 'The long paragraph under that heading.';
comment on column public.services.meta        is 'Up to 3 highlight pairs: [{"k":"18mm boards","v":"Moisture-resistant"}].';
comment on column public.services.bullets     is 'Checklist lines under the block.';
comment on column public.services.cta_label   is 'WhatsApp button label, e.g. "Request kitchen quotation".';
comment on column public.services.link_label  is 'Secondary link label, e.g. "See kitchen designs".';
comment on column public.services.link_href   is 'Secondary link target, e.g. "designs.html".';

drop trigger if exists services_touch_updated_at on public.services;
create trigger services_touch_updated_at
  before update on public.services
  for each row execute function public.touch_updated_at();

-- =====================================================================================
-- §7  ROW LEVEL SECURITY — everybody reads, only admins write
-- =====================================================================================
alter table public.hero_slides enable row level security;
alter table public.designs     enable row level security;
alter table public.materials   enable row level security;
alter table public.services    enable row level security;

-- ---------- hero_slides ----------
drop policy if exists "hero_slides: public read" on public.hero_slides;
create policy "hero_slides: public read"
  on public.hero_slides for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "hero_slides: admin insert" on public.hero_slides;
create policy "hero_slides: admin insert"
  on public.hero_slides for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "hero_slides: admin update" on public.hero_slides;
create policy "hero_slides: admin update"
  on public.hero_slides for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "hero_slides: admin delete" on public.hero_slides;
create policy "hero_slides: admin delete"
  on public.hero_slides for delete
  to authenticated
  using (public.is_admin());

-- ---------- designs ----------
drop policy if exists "designs: public read" on public.designs;
create policy "designs: public read"
  on public.designs for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "designs: admin insert" on public.designs;
create policy "designs: admin insert"
  on public.designs for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "designs: admin update" on public.designs;
create policy "designs: admin update"
  on public.designs for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "designs: admin delete" on public.designs;
create policy "designs: admin delete"
  on public.designs for delete
  to authenticated
  using (public.is_admin());

-- ---------- materials ----------
drop policy if exists "materials: public read" on public.materials;
create policy "materials: public read"
  on public.materials for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "materials: admin insert" on public.materials;
create policy "materials: admin insert"
  on public.materials for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "materials: admin update" on public.materials;
create policy "materials: admin update"
  on public.materials for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "materials: admin delete" on public.materials;
create policy "materials: admin delete"
  on public.materials for delete
  to authenticated
  using (public.is_admin());

-- ---------- services ----------
drop policy if exists "services: public read" on public.services;
create policy "services: public read"
  on public.services for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "services: admin insert" on public.services;
create policy "services: admin insert"
  on public.services for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "services: admin update" on public.services;
create policy "services: admin update"
  on public.services for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "services: admin delete" on public.services;
create policy "services: admin delete"
  on public.services for delete
  to authenticated
  using (public.is_admin());

-- =====================================================================================
-- §8  STORAGE — the "site-media" bucket every uploaded photo lands in
-- =====================================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  8388608,                                                            -- 8 MB per file
  array['image/jpeg','image/png','image/webp','image/avif','image/gif']
)
on conflict (id) do update
   set public             = true,
       file_size_limit    = excluded.file_size_limit,
       allowed_mime_types = excluded.allowed_mime_types;

-- anyone may look at the photos …
drop policy if exists "site-media: public read" on storage.objects;
create policy "site-media: public read"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- … only admins may add, replace or remove them.
drop policy if exists "site-media: admin upload" on storage.objects;
create policy "site-media: admin upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site-media: admin replace" on storage.objects;
create policy "site-media: admin replace"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site-media: admin delete" on storage.objects;
create policy "site-media: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media' and public.is_admin());

-- =====================================================================================
-- §9  INDEXES, REALTIME & GRANTS
-- =====================================================================================
create index if not exists hero_slides_position_idx on public.hero_slides (position);
create index if not exists designs_position_idx     on public.designs     (position);
create index if not exists designs_category_idx     on public.designs     (category);
create index if not exists materials_position_idx   on public.materials   (position);
create index if not exists materials_category_idx   on public.materials   (category);
create index if not exists services_position_idx    on public.services    (position);

-- live updates: an edit made on one device appears on the others without a refresh
do $$
declare t text;
begin
  foreach t in array array['hero_slides','designs','materials','services']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
      raise notice 'realtime enabled for public.%', t;
    exception when duplicate_object or duplicate_table then
      null;   -- already in the publication
    end;
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;

grant select                          on public.admins       to authenticated;
grant select, insert, update, delete  on public.hero_slides  to anon, authenticated, service_role;
grant select, insert, update, delete  on public.designs      to anon, authenticated, service_role;
grant select, insert, update, delete  on public.materials    to anon, authenticated, service_role;
grant select, insert, update, delete  on public.services     to anon, authenticated, service_role;
-- (RLS above is what actually decides who may do what; these grants only expose the tables.)

-- =====================================================================================
-- §10 SEED — today's live content, loaded once
-- =====================================================================================
-- Every row mirrors what js/data.js already ships, so the moment the website starts
-- reading Supabase it looks pixel-identical. Re-running this script never overwrites
-- your edits (on conflict do nothing). Photos are seeded as the site's own relative
-- paths; replace any of them from the admin overlay and the new file is uploaded to
-- the "site-media" bucket instead.

-- ---------- homepage slideshow ----------
insert into public.hero_slides
  (code, label, image_url, image_url_760, image_url_480, image_alt, position, is_active)
values
  ('h01', 'Kitchen cabinets', 'assets/img/hero-1-kitchen.jpg', 'assets/img/sm/hero-1-kitchen-760.jpg', 'assets/img/sm/hero-1-kitchen-480.jpg', 'Kitchen cabinets — handleless walnut and matte white with a quartz island, installed in Kilimani, Nairobi', 10, true),
  ('h02', 'Walk-in wardrobe', 'assets/img/hero-2-wardrobe.jpg', 'assets/img/sm/hero-2-wardrobe-760.jpg', 'assets/img/sm/hero-2-wardrobe-480.jpg', 'Walk-in wardrobe with lit shelving fitted in Lavington, Nairobi', 20, true),
  ('h03', 'Gypsum ceiling', 'assets/img/hero-3-living-gypsum.jpg', 'assets/img/sm/hero-3-living-gypsum-760.jpg', 'assets/img/sm/hero-3-living-gypsum-480.jpg', 'Living room with gypsum ceiling and cove lighting completed in Milimani, Nakuru', 30, true),
  ('h04', 'Shop renovation', 'assets/img/hero-4-shop.jpg', 'assets/img/sm/hero-4-shop-760.jpg', 'assets/img/sm/hero-4-shop-480.jpg', 'Boutique shop interior with fluted panels and display rails, renovated in Thika', 40, true),
  ('h05', 'Aluminium works', 'assets/img/hero-5-aluminum.jpg', 'assets/img/sm/hero-5-aluminum-760.jpg', 'assets/img/sm/hero-5-aluminum-480.jpg', 'Aluminium sliding doors and glass balustrade installed in Naivasha', 50, true)
on conflict (code) do nothing;

-- ---------- designs ----------
insert into public.designs
  (code, title, category, image_url, image_url_760, image_url_480, image_alt,
   badge, lead_time, unit, summary, features, materials, position, is_active)
values
  ('d01', 'Modern L-Shaped Kitchen Cabinets', 'Kitchen Cabinets', 'assets/img/d-kitchen-lshape.jpg', 'assets/img/sm/d-kitchen-lshape-760.jpg', 'assets/img/sm/d-kitchen-lshape-480.jpg', 'Modern L-Shaped Kitchen Cabinets — Kitchen Cabinets by Redefine Interiors',
   'Best seller', '2 – 3 weeks', '', 'Matte graphite cabinets with a warm walnut worktop, soft-close everything and a fully fitted corner unit that uses every centimetre of your kitchen.',
   '["18mm moisture-resistant MDF carcass","Soft-close hinges & drawer runners","Solid wood / quartz worktop","Designated appliance & bin housings"]'::jsonb, '["18mm MDF","Melamine laminate","Soft-close hardware"]'::jsonb, 10, true),
  ('d02', 'White Gloss Kitchen & Breakfast Bar', 'Kitchen Cabinets', 'assets/img/d-kitchen-white-gloss.jpg', 'assets/img/sm/d-kitchen-white-gloss-760.jpg', 'assets/img/sm/d-kitchen-white-gloss-480.jpg', 'White Gloss Kitchen & Breakfast Bar — Kitchen Cabinets by Redefine Interiors',
   'Showroom finish', '3 weeks', '', 'Handleless high-gloss doors, charcoal quartz tops and a slim breakfast bar — a bright, easy-clean kitchen that suits modern Nairobi apartments.',
   '["Handleless push-to-open doors","Quartz or granite worktop","Glass splashback option","Breakfast bar with seating"]'::jsonb, '["High-gloss acrylic","Quartz tops","Brass tap set"]'::jsonb, 20, true),
  ('d03', 'U-Shaped Family Kitchen + Pantry', 'Kitchen Cabinets', 'assets/img/d-kitchen-ushape.jpg', 'assets/img/sm/d-kitchen-ushape-760.jpg', 'assets/img/sm/d-kitchen-ushape-480.jpg', 'U-Shaped Family Kitchen + Pantry — Kitchen Cabinets by Redefine Interiors',
   '', '3 – 4 weeks', '', 'A full family kitchen with a tall pantry, double oven housing and a generous island — designed for large households and serious cooking.',
   '["Tall pantry & larder units","Island with rails & pendant lighting","Built-in oven & microwave housing","Pull-out baskets and corner carousel"]'::jsonb, '["Shaker doors","Oak worktops","Pull-out baskets"]'::jsonb, 30, true),
  ('d04', '4-Door Sliding Mirror Wardrobe', 'Wardrobes', 'assets/img/d-wardrobe-sliding.jpg', 'assets/img/sm/d-wardrobe-sliding-760.jpg', 'assets/img/sm/d-wardrobe-sliding-480.jpg', '4-Door Sliding Mirror Wardrobe — Wardrobes by Redefine Interiors',
   'Popular', '7 – 10 days', '', 'Two mirror doors, two veneer doors and internal fittings that actually make sense — hanging rails, shelves, shoe rack and a lockable drawer.',
   '["Soft-close sliding system","Full-length mirror doors","Interior LED downlighting","Drawers, shelves & shoe rack"]'::jsonb, '["18mm MDF","Veneer / laminate","Sliding rails & rollers"]'::jsonb, 40, true),
  ('d05', 'Luxury Walk-In Closet', 'Wardrobes', 'assets/img/d-walkin-closet.jpg', 'assets/img/sm/d-walkin-closet-760.jpg', 'assets/img/sm/d-walkin-closet-480.jpg', 'Luxury Walk-In Closet — Wardrobes by Redefine Interiors',
   'Premium', '3 weeks', '', 'A boutique-style walk-in with lit hanging rails, glass display doors, a jewellery drawer unit and an island ottoman for the master suite.',
   '["Lit rails & shelf LED strips","Glass display doors","Jewellery drawer with glass top","Island / ottoman option"]'::jsonb, '["Walnut panels","Glass doors","LED strip lighting"]'::jsonb, 50, true),
  ('d06', 'Boutique Fitted Wardrobe Wall', 'Wardrobes', 'assets/img/hero-2-wardrobe.jpg', 'assets/img/sm/hero-2-wardrobe-760.jpg', 'assets/img/sm/hero-2-wardrobe-480.jpg', 'Boutique Fitted Wardrobe Wall — Wardrobes by Redefine Interiors',
   'Space saver', '10 – 14 days', '', 'A full wall of fitted storage with open display shelving, drawers and a dressing corner — perfect for bedrooms that have to work harder.',
   '["Floor-to-ceiling fitted run","Drawers, shelves & display niches","Interior LED strip lighting","Matching mirror and stool"]'::jsonb, '["White-oak laminate","LED strip lighting","Soft-close hinges"]'::jsonb, 60, true),
  ('d07', 'Aluminium Sliding Doors & Windows', 'Aluminium Works', 'assets/img/hero-5-aluminum.jpg', 'assets/img/sm/hero-5-aluminum-760.jpg', 'assets/img/sm/hero-5-aluminum-480.jpg', 'Aluminium Sliding Doors & Windows — Aluminium Works by Redefine Interiors',
   'Security', '5 – 10 days', 'per sqm', 'Slim aluminium frames, smooth gliding rollers, mosquito mesh and security grilles — measured, fabricated and installed by our own team.',
   '["Powder-coated / anodised frames","Mosquito mesh & security grilles","High-quality rollers and locks","Site measurement included"]'::jsonb, '["Aluminium profiles","4 – 8mm glass","Mesh & grilles"]'::jsonb, 70, true),
  ('d08', 'Gypsum Ceiling with Cove Lighting', 'Gypsum Works', 'assets/img/hero-3-living-gypsum.jpg', 'assets/img/sm/hero-3-living-gypsum-760.jpg', 'assets/img/sm/hero-3-living-gypsum-480.jpg', 'Gypsum Ceiling with Cove Lighting — Gypsum Works by Redefine Interiors',
   'Most requested', '3 – 7 days', 'per sqm', 'Hidden cove lighting, recessed spotlights and clean straight lines — the single fastest way to make a sitting room feel expensive.',
   '["Concealed LED cove","Recessed spotlight layout","Cornice and shadow gaps","Crack-free jointing & skim"]'::jsonb, '["9mm gypsum boards","Metal studs & channels","LED cove lighting"]'::jsonb, 80, true),
  ('d09', 'Boutique Shop Renovation', 'Shop Renovation', 'assets/img/hero-4-shop.jpg', 'assets/img/sm/hero-4-shop-760.jpg', 'assets/img/sm/hero-4-shop-480.jpg', 'Boutique Shop Renovation — Shop Renovation by Redefine Interiors',
   'Turnkey', '3 – 5 weeks', '', 'Fluted panels, display rails, cash counter, lighting and branding surfaces — a retail space customers want to walk into.',
   '["Display shelving & rails","Fluted wall panels","Track & accent lighting","Counter, signage & fitting rooms"]'::jsonb, '["Fluted WPC panels","Track spotlights","Terrazzo / tile flooring"]'::jsonb, 90, true),
  ('d10', 'Complete 3-Bedroom Home Fit-Out', 'Fittings', 'assets/img/hero-1-kitchen.jpg', 'assets/img/sm/hero-1-kitchen-760.jpg', 'assets/img/sm/hero-1-kitchen-480.jpg', 'Complete 3-Bedroom Home Fit-Out — Fittings by Redefine Interiors',
   'One contract', '5 – 8 weeks', '', 'One team, one contract: kitchen, wardrobes, gypsum ceilings, aluminium, doors, locks, sanitary and all plumbing fittings for the whole house.',
   '["Kitchen + 3 wardrobes","Full gypsum ceiling package","All doors, locks & handles","Sanitary & plumbing fittings"]'::jsonb, '["Full material supply","Labour & installation","Site supervision"]'::jsonb, 100, true)
on conflict (code) do nothing;

-- ---------- materials ----------
insert into public.materials
  (code, name, category, image_url, image_url_760, image_url_480, image_alt,
   swatch, icon, unit, badge, note, position, is_active)
values
  ('m01', '18mm MDF Board', 'Boards & Panels', 'assets/img/mat-mdf-board.jpg', 'assets/img/sm/mat-mdf-board-760.jpg', 'assets/img/sm/mat-mdf-board-480.jpg', '18mm MDF Board supplied by Redefine Interiors Kenya',
   'mdf', 'box', 'per 8×4ft sheet', 'In stock', 'Moisture-resistant grade for kitchens and bathrooms. Bulk discounts on project orders.', 10, true),
  ('m02', 'Melamine Laminate Sheet', 'Boards & Panels', 'assets/img/mat-laminate-sheet.jpg', 'assets/img/sm/mat-laminate-sheet-760.jpg', 'assets/img/sm/mat-laminate-sheet-480.jpg', 'Melamine Laminate Sheet supplied by Redefine Interiors Kenya',
   'laminate', 'palette', 'per 8×4ft sheet', '40+ colours', 'Woodgrains, marbles and plain colours. Matching edge tape available.', 20, true),
  ('m03', 'Cabinet Hardware Kit', 'Hardware & Fittings', 'assets/img/mat-hardware-kit.jpg', 'assets/img/sm/mat-hardware-kit-760.jpg', 'assets/img/sm/mat-hardware-kit-480.jpg', 'Cabinet Hardware Kit supplied by Redefine Interiors Kenya',
   'hardware', 'wrench', 'per kit', 'Soft-close', '20 soft-close hinges, 5 pairs of drawer runners, screws and buffers.', 30, true),
  ('m04', 'Kitchen Sink & Pull-Out Tap Set', 'Hardware & Fittings', 'assets/img/mat-sink-tap.jpg', 'assets/img/sm/mat-sink-tap-760.jpg', 'assets/img/sm/mat-sink-tap-480.jpg', 'Kitchen Sink & Pull-Out Tap Set supplied by Redefine Interiors Kenya',
   'steel', 'wrench', 'per set', '304 stainless', 'Undercut double bowl sink with pull-out mixer, waste kit and fittings.', 40, true),
  ('m05', 'Gypsum Ceiling Board', 'Gypsum & Ceilings', 'assets/img/mat-gypsum-board.jpg', 'assets/img/sm/mat-gypsum-board-760.jpg', 'assets/img/sm/mat-gypsum-board-480.jpg', 'Gypsum Ceiling Board supplied by Redefine Interiors Kenya',
   'gypsum', 'layers', 'per 1.2×2.4m board', '9mm', 'Ceiling-grade boards. Studs, channels, joint tape and skim also available.', 50, true),
  ('m06', 'Aluminium Window & Door Profiles', 'Aluminium', 'assets/img/mat-aluminium-profiles.jpg', 'assets/img/sm/mat-aluminium-profiles-760.jpg', 'assets/img/sm/mat-aluminium-profiles-480.jpg', 'Aluminium Window & Door Profiles supplied by Redefine Interiors Kenya',
   'aluminium', 'window', 'per kg', 'Anodised', 'Silver, black and bronze finishes. Cut-to-size and fabrication on request.', 60, true),
  ('m07', 'Porcelain Floor Tile 600×600', 'Tiles & Finishes', 'assets/img/mat-porcelain-tile.jpg', 'assets/img/sm/mat-porcelain-tile-760.jpg', 'assets/img/sm/mat-porcelain-tile-480.jpg', 'Porcelain Floor Tile 600×600 supplied by Redefine Interiors Kenya',
   'tile', 'palette', 'per sqm', 'Matt / gloss', 'Lappato, marble-look and wood-look ranges. Free samples on request.', 70, true),
  ('m08', 'Fluted WPC Wall Panel', 'Tiles & Finishes', 'assets/img/mat-fluted-panel.jpg', 'assets/img/sm/mat-fluted-panel-760.jpg', 'assets/img/sm/mat-fluted-panel-480.jpg', 'Fluted WPC Wall Panel supplied by Redefine Interiors Kenya',
   'fluted', 'layers2', 'per panel (300×2900mm)', 'Waterproof', 'Popular for TV walls, shop fronts and reception areas. Trims available.', 80, true),
  ('m09', 'Quartz Countertop Slab', 'Countertops', 'assets/img/mat-quartz-slab.jpg', 'assets/img/sm/mat-quartz-slab-760.jpg', 'assets/img/sm/mat-quartz-slab-480.jpg', 'Quartz Countertop Slab supplied by Redefine Interiors Kenya',
   'quartz', 'spark', 'per sqm fitted', '20mm', 'Marble-look quartz with cut-outs, joins and edge profiling included.', 90, true),
  ('m10', 'LED Spotlight & Cove Strip Pack', 'Lighting', '', '', '', 'LED Spotlight & Cove Strip Pack supplied by Redefine Interiors Kenya',
   'led', 'bulb', 'per pack', 'Warm / cool', '6 recessed spotlights plus 5m of cove strip with driver and connectors.', 100, true)
on conflict (code) do nothing;

-- ---------- services (cards + the six services.html blocks) ----------
insert into public.services
  (slug, title, icon, image_url, image_url_760, image_url_480, image_alt,
   card_text, eyebrow, block_title, body, meta, bullets,
   cta_label, link_label, link_href, position, is_active)
values
  ('kitchen-cabinets', 'Kitchen Cabinets', 'cabinet', 'assets/img/d-kitchen-ushape.jpg', 'assets/img/sm/d-kitchen-ushape-760.jpg', 'assets/img/sm/d-kitchen-ushape-480.jpg', 'U-shaped kitchen with island, cream shaker cabinets and pendant lights built in Kenya',
   'Bespoke kitchens — carcasses, doors, worktops, sinks and appliance housing, built to your exact measurements.', '01 · Kitchens', 'Kitchen cabinets', 'A kitchen is 70% cabinet and 30% layout. We get the layout right first — where the sink, cooker, fridge and prep space sit — then build carcasses in 18mm moisture-resistant board with soft-close hardware, worktops in quartz, granite or solid wood, and internals that actually fit your pots and pans.',
   '[{"k":"18mm boards","v":"Moisture-resistant"},{"k":"Soft-close","v":"Hinges & runners"},{"k":"2 – 4 weeks","v":"Typical delivery"}]'::jsonb, '["Melamine, acrylic gloss, veneer or shaker doors","Tall pantry, appliance and bin housing units","Quartz / granite worktops with sink & hob cut-outs","Soft-close hinges, quality runners, corner carousels"]'::jsonb,
   'Request kitchen quotation', 'See kitchen designs', 'designs.html', 10, true),
  ('wardrobes', 'Wardrobes & Closets', 'wardrobe', 'assets/img/d-wardrobe-sliding.jpg', 'assets/img/sm/d-wardrobe-sliding-760.jpg', 'assets/img/sm/d-wardrobe-sliding-480.jpg', 'Four door sliding wardrobe with mirror doors fitted in a Kenyan bedroom',
   'Sliding, hinged, walk-in and combined wardrobe-plus-desk units with fittings that last.', '02 · Bedrooms', 'Wardrobes & closets', 'Sliding, hinged, walk-in or combined wardrobe-plus-desk units — designed around how you actually dress, with short-hang, long-hang, drawer, shoe and suitcase zones. Sliding doors save up to 900mm of floor space compared with hinged doors.',
   '[{"k":"Mirror doors","v":"Full-length option"},{"k":"Interior LED","v":"On rails & shelves"},{"k":"7 – 14 days","v":"Typical delivery"}]'::jsonb, '["Full-length mirror and veneer door combinations","Interior LED lighting on rails and shelves","Drawers, jewellery trays, shoe racks & tie rails","Floor-to-ceiling units that close the dust gap"]'::jsonb,
   'Request wardrobe quotation', 'See wardrobe designs', 'designs.html', 20, true),
  ('aluminium-works', 'Aluminium Works', 'window', 'assets/img/hero-5-aluminum.jpg', 'assets/img/sm/hero-5-aluminum-760.jpg', 'assets/img/sm/hero-5-aluminum-480.jpg', 'Aluminium sliding windows with security grilles installed in a Kenyan home',
   'Windows, sliding doors, shop fronts, gypsum partitions, balustrades and burglar proofing.', '03 · Windows & partitions', 'Aluminium works', 'Windows, sliding doors, shop fronts, office partitions, glass balustrades, shower cubicles, mosquito mesh and burglar proofing. We fabricate in our workshop from measured site dimensions, so frames arrive square and fit the first time.',
   '[{"k":"Powder-coated","v":"Black · bronze · silver"},{"k":"4 – 8mm glass","v":"Single or double"},{"k":"5 – 10 days","v":"Typical delivery"}]'::jsonb, '["Powder-coated and anodised finishes: black, bronze, silver, charcoal","4mm – 8mm glass, single or double glazed","Sliding, casement, awning and fixed frames","Security grilles, mesh and quality locking gear"]'::jsonb,
   'Request aluminium quotation', 'Aluminium profiles', 'materials.html', 30, true),
  ('gypsum-works', 'Gypsum Works', 'layers', 'assets/img/hero-3-living-gypsum.jpg', 'assets/img/sm/hero-3-living-gypsum-760.jpg', 'assets/img/sm/hero-3-living-gypsum-480.jpg', 'Gypsum ceiling with concealed cove lighting installed in a Kenyan sitting room',
   'Ceilings, cove lighting, cornices, partitions, TV feature walls and decorative curves.', '04 · Ceilings & walls', 'Gypsum works', 'Ceilings, cove lighting, cornices, shadow gaps, partitions, TV feature walls and decorative curves. Gypsum is the fastest way to make a room feel designed — and the jointing is where most fundis fail. Ours is taped, filled, sanded and primed until you cannot see a seam.',
   '[{"k":"Cove lighting","v":"Concealed LED"},{"k":"Crack-free","v":"Taped & skimmed"},{"k":"3 – 9 days","v":"Typical delivery"}]'::jsonb, '["Concealed cove lighting and recessed spotlight layout","Curved and sculpted media walls with niches","Room partitions and dropped ceiling sections","Crack-resistant jointing, cornice and finishing"]'::jsonb,
   'Request gypsum quotation', 'Gypsum boards & fittings', 'materials.html', 40, true),
  ('shop-renovation', 'Shop Renovation', 'shop', 'assets/img/hero-4-shop.jpg', 'assets/img/sm/hero-4-shop-760.jpg', 'assets/img/sm/hero-4-shop-480.jpg', 'Boutique shop interior with fluted panels and display rails after renovation in Kenya',
   'Retail, salon, barbershop, clinic and office fit-outs — shelving, counters, lighting and branding surfaces.', '05 · Commercial', 'Shop renovation', 'Boutiques, salons, barbershops, minimarts, pharmacies, clinics, restaurants and offices. We plan your customer flow — entrance, display zones, till point and storage — then build shelving, counters, ceilings, lighting, partitions and shop fronts. Night work available so you do not lose trading days.',
   '[{"k":"Turnkey","v":"One team, one job"},{"k":"Night work","v":"Available"},{"k":"3 – 6 weeks","v":"Typical delivery"}]'::jsonb, '["Display shelving, rails, gondolas and counters","Fluted panels, signage surfaces and brand colours","Gypsum ceilings, aluminium shop fronts, glass partitions","Track, accent and feature lighting layout"]'::jsonb,
   'Request shop quotation', 'Book a site survey', 'contact.html', 50, true),
  ('fittings', 'All Fittings Work', 'wrench', 'assets/img/hero-1-kitchen.jpg', 'assets/img/sm/hero-1-kitchen-760.jpg', 'assets/img/sm/hero-1-kitchen-480.jpg', 'Cabinet hardware, hinges and handles supplied by Redefine Interiors in Kenya',
   'Doors, locks, handles, hinges, sinks, taps, sanitary ware, lighting and finishing — supplied and installed.', '06 · Finishing', 'All fittings work', 'The details that decide whether a space feels cheap or complete: doors, locks, handles, hinges, drawer runners, sinks, taps, showers, sanitary ware, mirrors, shelving and lighting — supplied and installed properly, the same week.',
   '[{"k":"Supply & fit","v":"Same week"},{"k":"Genuine brands","v":"Only"},{"k":"1 – 5 days","v":"Typical delivery"}]'::jsonb, '["Door hanging, locksets, handles and closers","Sinks, taps, mixers, wastes and plumbing fittings","Bathroom vanities, mirrors, shower cubicles","Cabinet hardware upgrades (soft-close conversions)"]'::jsonb,
   'Request fittings quotation', 'Hardware & fittings', 'materials.html', 60, true)
on conflict (slug) do nothing;


-- =====================================================================================
-- §11 QUICK CHECKS — paste any of these into the SQL Editor whenever you want to look
-- =====================================================================================
--  How much content is live?
--    select 'hero_slides' as t, count(*) from public.hero_slides where is_active
--    union all select 'designs',     count(*) from public.designs     where is_active
--    union all select 'materials',   count(*) from public.materials   where is_active
--    union all select 'services',    count(*) from public.services    where is_active;
--
--  Who can edit the site?
--    select email, phone, role, is_active, last_login_at from public.admins order by created_at;
--
--  Am I an admin? (returns null unless you are signed in as an active admin — useful
--  inside the Studio SQL editor only when running as a logged-in role)
--    select public.current_admin();
--
--  Promote an account (after creating it under Authentication → Users):
--    select public.grant_admin('you@example.com');
--    select public.grant_admin('+254703142874');
--    select public.grant_admin('you@example.com', 'owner', 'Your Name');
--
--  Demote an account (keeps the row, removes the ability to edit):
--    select public.revoke_admin('you@example.com');
--
--  Bucket + policies sanity check:
--    select id, public, file_size_limit from storage.buckets where id = 'site-media';
--    select tablename, policyname, cmd, roles from pg_policies
--     where schemaname in ('public','storage') order by tablename, cmd;
--
--  Reset to the shipped content (destructive — then re-run §10):
--    truncate public.hero_slides, public.designs, public.materials, public.services;
--
-- =====================================================================================
--  END OF FILE
-- =====================================================================================
