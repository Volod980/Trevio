-- =============================================
-- TREVIO - Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor
-- =============================================

-- Orders table
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  product_name text not null,
  description text,
  photo_count integer not null,
  style_direction text not null check (style_direction in ('studio', 'lifestyle', 'street', 'other')),
  style_direction_custom text,
  extra_fast_delivery boolean default false,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order files table
create table if not exists order_files (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  file_url text not null,
  file_name text not null,
  file_type text not null check (file_type in ('product_photo', 'pose_reference', 'result')),
  uploaded_by text not null check (uploaded_by in ('client', 'admin')),
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security
-- =============================================

alter table orders enable row level security;
alter table order_files enable row level security;

-- Clients can only see and manage their own orders
create policy "clients_own_orders" on orders
  for all using (auth.uid() = user_id);

-- Users can access files that belong to their orders
create policy "files_via_order" on order_files
  for all using (
    exists (select 1 from orders where orders.id = order_id and orders.user_id = auth.uid())
  );

-- =============================================
-- Admin policies (uncomment and set your admin user ID)
-- =============================================

-- Alternative: create admin policies by email
-- You can set up admin access by checking user metadata or using a separate admin_users table

-- create policy "admin_all_orders" on orders
--   for all using (
--     auth.jwt() ->> 'email' = any(string_to_array(current_setting('app.admin_emails', true), ','))
--   );

-- =============================================
-- Storage Buckets
-- =============================================

-- Create in Supabase Dashboard → Storage → New Bucket:
-- 1. "order-uploads" (private) - for client uploads (product photos, pose references)
-- 2. "order-results" (private) - for admin uploads (result files)

-- Storage policies for order-uploads bucket:
-- Allow clients to upload to their own order folders
insert into storage.buckets (id, name, public) values ('order-uploads', 'order-uploads', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('order-results', 'order-results', false)
  on conflict (id) do nothing;

-- Storage access policies
create policy "client_upload_own_files" on storage.objects
  for insert with check (
    bucket_id = 'order-uploads'
    and auth.role() = 'authenticated'
  );

create policy "client_read_own_files" on storage.objects
  for select using (
    bucket_id = 'order-uploads'
    and auth.role() = 'authenticated'
  );

create policy "admin_manage_results" on storage.objects
  for all using (
    bucket_id = 'order-results'
    and auth.role() = 'authenticated'
  );

create policy "client_read_results" on storage.objects
  for select using (
    bucket_id = 'order-results'
    and auth.role() = 'authenticated'
  );

-- =============================================
-- Function to automatically update updated_at
-- =============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_orders_updated_at
  before update on orders
  for each row execute function update_updated_at_column();
