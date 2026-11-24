-- =========================================================
-- Supabase Schema & Storage Setup for Friends QR Circle
-- Run this script inside the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- =========================================================

-- 1. Enable UUID generator
create extension if not exists pgcrypto;

-- 2. Create the QR Codes table
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bank text not null,
  group_name text not null,
  qr_path text not null,
  extra_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.qr_codes enable row level security;

-- 4. Set RLS Policies for public.qr_codes
-- Allow anyone to view QR records
drop policy if exists "Anyone can view QR records" on public.qr_codes;
create policy "Anyone can view QR records"
  on public.qr_codes for select
  using (true);

-- Allow anyone with anon key to insert new QR records
drop policy if exists "Demo can add QR records" on public.qr_codes;
create policy "Demo can add QR records"
  on public.qr_codes for insert
  with check (true);

-- Allow anyone with anon key to update QR records
drop policy if exists "Demo can edit QR records" on public.qr_codes;
create policy "Demo can edit QR records"
  on public.qr_codes for update
  using (true) with check (true);

-- Allow anyone with anon key to delete QR records
drop policy if exists "Demo can delete QR records" on public.qr_codes;
create policy "Demo can delete QR records"
  on public.qr_codes for delete
  using (true);

-- 5. Create the public Storage Bucket for QR images
insert into storage.buckets (id, name, public)
values ('qr-images', 'qr-images', true)
on conflict (id) do update set public = true;

-- 6. Storage Bucket RLS Policies for 'qr-images'
drop policy if exists "Anyone can view QR images" on storage.objects;
create policy "Anyone can view QR images"
  on storage.objects for select
  using (bucket_id = 'qr-images');

drop policy if exists "Demo can upload QR images" on storage.objects;
create policy "Demo can upload QR images"
  on storage.objects for insert
  with check (bucket_id = 'qr-images');

drop policy if exists "Demo can edit QR images" on storage.objects;
create policy "Demo can edit QR images"
  on storage.objects for update
  using (bucket_id = 'qr-images') with check (bucket_id = 'qr-images');

drop policy if exists "Demo can delete QR images" on storage.objects;
create policy "Demo can delete QR images"
  on storage.objects for delete
  using (bucket_id = 'qr-images');

-- 7. Enable Realtime updates across all web clients
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'qr_codes'
  ) then
    alter publication supabase_realtime add table public.qr_codes;
  end if;
end $$;
