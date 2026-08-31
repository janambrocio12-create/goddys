-- =========================================================================
-- GODDYS — 0001_init_schema.sql
-- Core schema: extensions, enums, tables, indexes, updated_at triggers.
-- Design goals: normalized, auditable, extensible without breaking changes.
-- =========================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";        -- case-insensitive text (emails, codes)

-- -------------------------------------------------------------------------
-- Enums
-- -------------------------------------------------------------------------

create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum (
  'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
create type public.payment_status as enum (
  'unpaid', 'paid', 'failed', 'refunded', 'partially_refunded'
);
create type public.admin_role as enum ('super_admin', 'admin', 'manager', 'staff');
create type public.discount_type as enum ('percentage', 'fixed_amount');
create type public.inventory_movement_type as enum (
  'restock', 'sale', 'return', 'adjustment', 'reserved', 'release'
);

-- -------------------------------------------------------------------------
-- Utility: generic updated_at trigger
-- -------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------------------
-- categories (self-referencing, so sub-categories can be added later
-- without a schema change)
-- -------------------------------------------------------------------------

create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  parent_id      uuid references public.categories(id) on delete set null,
  image_url      text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index categories_parent_id_idx on public.categories(parent_id);
create index categories_slug_idx on public.categories(slug);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- products
-- -------------------------------------------------------------------------

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  price          numeric(10,2) not null check (price >= 0),
  sale_price     numeric(10,2) check (sale_price >= 0),
  category_id    uuid references public.categories(id) on delete set null,
  sku            text not null unique,
  status         public.product_status not null default 'draft',
  is_featured    boolean not null default false,
  is_new_arrival boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint sale_price_below_price check (sale_price is null or sale_price <= price)
);

create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_slug_idx on public.products(slug);
create index products_featured_idx on public.products(is_featured) where is_featured = true;
create index products_new_arrival_idx on public.products(is_new_arrival) where is_new_arrival = true;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- product_variants — one row per size/color combination
-- -------------------------------------------------------------------------

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  size           text not null,
  color          text not null,
  sku            text not null unique,
  price_override numeric(10,2) check (price_override >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_id, size, color)
);

create index product_variants_product_id_idx on public.product_variants(product_id);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- product_images — can be tied to a specific variant (e.g. color-specific
-- photography) or left product-wide (variant_id null)
-- -------------------------------------------------------------------------

create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  variant_id    uuid references public.product_variants(id) on delete cascade,
  url           text not null,
  alt_text      text,
  display_order integer not null default 0,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images(product_id);
create index product_images_variant_id_idx on public.product_images(variant_id);

-- -------------------------------------------------------------------------
-- customers — 1:1 extension of auth.users, holds storefront profile data
-- -------------------------------------------------------------------------

create table public.customers (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  phone             text,
  addresses         jsonb not null default '[]'::jsonb,
  marketing_opt_in  boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- admin_profiles — 1:1 extension of auth.users for staff/admin accounts.
-- NOT auto-provisioned on signup (see 0003) — must be created deliberately
-- by an existing super_admin so the admin panel can never be self-served.
-- -------------------------------------------------------------------------

create table public.admin_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        public.admin_role not null default 'staff',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- discounts
-- -------------------------------------------------------------------------

create table public.discounts (
  id                uuid primary key default gen_random_uuid(),
  code              citext not null unique,
  description       text,
  type              public.discount_type not null,
  value             numeric(10,2) not null check (value > 0),
  min_order_amount  numeric(10,2) not null default 0,
  usage_limit       integer,
  times_used        integer not null default 0,
  starts_at         timestamptz,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger discounts_set_updated_at
  before update on public.discounts
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- orders — money fields and the shipping/billing address are snapshotted
-- at checkout time so later edits to a customer's saved address, or to a
-- discount's rules, never mutate historical orders.
-- -------------------------------------------------------------------------

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  customer_id       uuid references public.customers(id) on delete set null,
  status            public.order_status not null default 'pending',
  payment_status    public.payment_status not null default 'unpaid',
  subtotal          numeric(10,2) not null default 0,
  discount_id       uuid references public.discounts(id) on delete set null,
  discount_amount   numeric(10,2) not null default 0,
  shipping_amount   numeric(10,2) not null default 0,
  tax_amount        numeric(10,2) not null default 0,
  total_amount      numeric(10,2) not null default 0,
  shipping_address  jsonb not null,
  billing_address   jsonb,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- order_items — product/variant details are snapshotted at purchase time
-- -------------------------------------------------------------------------

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  product_variant_id  uuid references public.product_variants(id) on delete set null,
  product_name        text not null,
  variant_details     jsonb not null,
  unit_price          numeric(10,2) not null check (unit_price >= 0),
  quantity            integer not null check (quantity > 0),
  subtotal            numeric(10,2) not null check (subtotal >= 0)
);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_variant_id_idx on public.order_items(product_variant_id);

-- -------------------------------------------------------------------------
-- inventory (inventory_movements) — an append-only ledger rather than a
-- single mutable counter. product_variants.stock_quantity is a cached
-- current total that a trigger keeps in sync (see 0003); the ledger is
-- what makes stock auditable and lets multi-warehouse support be added
-- later (e.g. a nullable warehouse_id) without restructuring anything.
-- -------------------------------------------------------------------------

create table public.inventory_movements (
  id                   uuid primary key default gen_random_uuid(),
  variant_id           uuid not null references public.product_variants(id) on delete cascade,
  movement_type        public.inventory_movement_type not null,
  quantity_change      integer not null,
  reference_order_id   uuid references public.orders(id) on delete set null,
  reason               text,
  created_by           uuid references public.admin_profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);

create index inventory_movements_variant_id_idx on public.inventory_movements(variant_id);
create index inventory_movements_order_id_idx on public.inventory_movements(reference_order_id);
