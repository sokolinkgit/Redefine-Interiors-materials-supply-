-- =====================================================================================
-- FIX: "The site_settings table is missing — run supabase sql"
-- Saves the photo under "Book a site visit" (home page "Why us" image) and any other
-- small admin choices. Copy-paste this WHOLE block into:
--     Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to run more than once (everything is "if not exists" / "drop then create").
-- It is the same as §6c + the site_settings part of §7 in supabase/schema.sql.
-- =====================================================================================

-- helper used by the trigger below (already exists if you ran schema.sql — harmless)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- the table ----------
create table if not exists public.site_settings (
  key            text primary key,
  value          jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null,
  check (key <> '')
);

comment on table  public.site_settings       is 'Key/value settings edited from the admin overlay (e.g. which gallery photo the home page "Why us" section shows).';
comment on column public.site_settings.value is 'JSON object. why_design → {"design": "<uuid or code of a designs row>"}.';

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------- row level security: everybody reads, only admins write ----------
alter table public.site_settings enable row level security;

drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings: admin insert" on public.site_settings;
create policy "site_settings: admin insert"
  on public.site_settings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "site_settings: admin update" on public.site_settings;
create policy "site_settings: admin update"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "site_settings: admin delete" on public.site_settings;
create policy "site_settings: admin delete"
  on public.site_settings for delete
  to authenticated
  using (public.is_admin());

-- ---------- grant the web app access ----------
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

-- done. Back on the website: edit the photo → Save — the error is gone.
