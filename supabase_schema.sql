-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

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

alter table public.qr_codes enable row level security;

create policy "Anyone can view QR records"
  on public.qr_codes for select
  using (true);

-- This keeps the current no-login demo flow working. For production,
-- replace these three policies with authenticated admin policies.
create policy "Demo can add QR records"
  on public.qr_codes for insert
  with check (true);
create policy "Demo can edit QR records"
  on public.qr_codes for update
  using (true) with check (true);
create policy "Demo can delete QR records"
  on public.qr_codes for delete
  using (true);

insert into storage.buckets (id, name, public)
values ('qr-images', 'qr-images', true)
on conflict (id) do update set public = true;

create policy "Anyone can view QR images"
  on storage.objects for select
  using (bucket_id = 'qr-images');
create policy "Demo can upload QR images"
  on storage.objects for insert
  with check (bucket_id = 'qr-images');
create policy "Demo can edit QR images"
  on storage.objects for update
  using (bucket_id = 'qr-images') with check (bucket_id = 'qr-images');
create policy "Demo can delete QR images"
  on storage.objects for delete
  using (bucket_id = 'qr-images');
