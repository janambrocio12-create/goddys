-- =========================================================================
-- GODDYS — 0002_rls_policies.sql
-- Row Level Security. Nothing is readable or writable by default; every
-- table gets RLS enabled and an explicit allow-list of policies.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Helper functions (security definer so they can read admin_profiles
-- regardless of the caller's own row-level access to that table)
-- -------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and is_active = true and role = 'super_admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_super_admin() to authenticated, anon;

-- -------------------------------------------------------------------------
-- Enable RLS everywhere
-- -------------------------------------------------------------------------

alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_variants    enable row level security;
alter table public.product_images      enable row level security;
alter table public.customers           enable row level security;
alter table public.admin_profiles      enable row level security;
alter table public.discounts           enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.inventory_movements enable row level security;

-- -------------------------------------------------------------------------
-- categories — public can browse active categories, admins manage all
-- -------------------------------------------------------------------------

create policy "categories_public_read" on public.categories
  for select using (is_active = true or public.is_admin());

create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------------
-- products — public can browse active listings, admins manage all
-- -------------------------------------------------------------------------

create policy "products_public_read" on public.products
  for select using (status = 'active' or public.is_admin());

create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------------
-- product_variants — readable when the parent product is browsable
-- -------------------------------------------------------------------------

create policy "product_variants_public_read" on public.product_variants
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.status = 'active'
    )
  );

create policy "product_variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------------
-- product_images — same visibility rule as variants
-- -------------------------------------------------------------------------

create policy "product_images_public_read" on public.product_images
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'active'
    )
  );

create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------------
-- customers — a customer only ever sees/edits their own row
-- -------------------------------------------------------------------------

create policy "customers_self_read" on public.customers
  for select using (id = auth.uid() or public.is_admin());

create policy "customers_self_insert" on public.customers
  for insert with check (id = auth.uid());

create policy "customers_self_update" on public.customers
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "customers_admin_delete" on public.customers
  for delete using (public.is_admin());

-- -------------------------------------------------------------------------
-- admin_profiles — admins can see the staff directory; only a super_admin
-- can create/edit/deactivate other admin accounts (never self-service)
-- -------------------------------------------------------------------------

create policy "admin_profiles_admin_read" on public.admin_profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "admin_profiles_super_admin_write" on public.admin_profiles
  for insert with check (public.is_super_admin());

create policy "admin_profiles_super_admin_update" on public.admin_profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy "admin_profiles_super_admin_delete" on public.admin_profiles
  for delete using (public.is_super_admin());

-- -------------------------------------------------------------------------
-- discounts — never exposed to the storefront directly; codes are
-- validated through the validate_discount_code() RPC in 0003, which runs
-- as security definer and returns only what checkout needs.
-- -------------------------------------------------------------------------

create policy "discounts_admin_only" on public.discounts
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------------
-- orders — a customer sees only their own orders; only admins change
-- status/fulfillment. Order creation is expected to go through a
-- server-side action (see src/lib/supabase/admin.ts) that validates
-- pricing and stock before writing, rather than a raw client insert.
-- -------------------------------------------------------------------------

create policy "orders_owner_read" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "orders_owner_insert" on public.orders
  for insert with check (customer_id = auth.uid() or public.is_admin());

create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "orders_admin_delete" on public.orders
  for delete using (public.is_super_admin());

-- -------------------------------------------------------------------------
-- order_items — visible through order ownership, written by admins /
-- the server-side checkout action
-- -------------------------------------------------------------------------

create policy "order_items_owner_read" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

create policy "order_items_owner_insert" on public.order_items
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending'
    )
  );

create policy "order_items_admin_write" on public.order_items
  for update using (public.is_admin()) with check (public.is_admin());

create policy "order_items_admin_delete" on public.order_items
  for delete using (public.is_admin());

-- -------------------------------------------------------------------------
-- inventory_movements — an admin-only, append-only audit ledger
-- -------------------------------------------------------------------------

create policy "inventory_admin_read" on public.inventory_movements
  for select using (public.is_admin());

create policy "inventory_admin_insert" on public.inventory_movements
  for insert with check (public.is_admin());

-- deliberately no update/delete policy: the ledger is immutable.
-- Corrections are made with a new offsetting 'adjustment' row.
