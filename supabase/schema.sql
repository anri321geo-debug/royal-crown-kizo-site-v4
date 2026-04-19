-- Run this in Supabase SQL Editor.
-- Enables media gallery + contact message backend for Kizo site + Android push token registry.

create extension if not exists pgcrypto;

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title_ka text not null,
  title_en text,
  title_ru text,
  media_type text not null check (media_type in ('photo', 'video')),
  file_path text,
  public_url text not null,
  thumbnail_path text,
  thumbnail_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text not null,
  language text,
  source text,
  page_url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  fcm_token text not null unique,
  app_instance_id text,
  platform text not null default 'android',
  app_version text,
  device_name text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_device_tokens_active on public.device_tokens (is_active);

alter table public.media_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.device_tokens enable row level security;

-- Public website can read published media.
drop policy if exists "public_read_media" on public.media_items;
create policy "public_read_media"
  on public.media_items
  for select
  using (published = true);

-- Authenticated admin users can manage media rows.
drop policy if exists "admin_manage_media" on public.media_items;
create policy "admin_manage_media"
  on public.media_items
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Admin can read messages in admin panel.
drop policy if exists "admin_read_messages" on public.contact_messages;
create policy "admin_read_messages"
  on public.contact_messages
  for select
  using (auth.role() = 'authenticated');

-- Admin can read registered device tokens if needed.
drop policy if exists "admin_read_device_tokens" on public.device_tokens;
create policy "admin_read_device_tokens"
  on public.device_tokens
  for select
  using (auth.role() = 'authenticated');

-- No direct public anon access to contact_messages or device_tokens tables.
-- Inserts/updates are handled by Netlify Functions using service role key.

-- Storage bucket for media files.
insert into storage.buckets (id, name, public)
values ('kizo-media', 'kizo-media', true)
on conflict (id) do nothing;

-- Public read of media bucket.
drop policy if exists "public_read_kizo_media" on storage.objects;
create policy "public_read_kizo_media"
  on storage.objects
  for select
  using (bucket_id = 'kizo-media');

-- Authenticated admin uploads/deletes in media bucket.
drop policy if exists "admin_manage_kizo_media" on storage.objects;
create policy "admin_manage_kizo_media"
  on storage.objects
  for all
  using (bucket_id = 'kizo-media' and auth.role() = 'authenticated')
  with check (bucket_id = 'kizo-media' and auth.role() = 'authenticated');
