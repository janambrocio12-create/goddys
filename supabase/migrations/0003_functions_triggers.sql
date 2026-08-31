-- =========================================================================
-- GODDYS — 0003_functions_triggers.sql
-- Business-logic glue: auto-provisioning, stock sync, discount validation.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Auto-create a `customers` row whenever someone signs up through
-- Supabase Auth. Admin accounts are never created this way — an
-- admin_profiles row must be inserted deliberately by a super_admin,
-- which is what keeps the admin panel from being self-serve signup.
-- -------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------------
-- Keep product_variants.stock_quantity as a live cached total driven by
-- the inventory_movements ledger, so reads (storefront stock checks) stay
-- a simple column read while writes go through an auditable trail.
-- -------------------------------------------------------------------------

create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The stock_quantity >= 0 check constraint on product_variants
  -- (0001_init_schema.sql) already rejects any movement that would drive
  -- stock negative, surfacing a standard constraint-violation error.
  update public.product_variants
  set stock_quantity = stock_quantity + new.quantity_change
  where id = new.variant_id;

  return new;
end;
$$;

create trigger on_inventory_movement_insert
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

-- -------------------------------------------------------------------------
-- validate_discount_code — the only way the storefront learns anything
-- about a discount. Runs as security definer so the `discounts` table
-- itself can stay admin-only, and returns just enough to apply it at
-- checkout, never the full row (usage counts, other codes, etc).
-- -------------------------------------------------------------------------

create or replace function public.validate_discount_code(p_code text, p_order_subtotal numeric)
returns table (
  is_valid boolean,
  discount_id uuid,
  type public.discount_type,
  value numeric,
  message text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  d public.discounts%rowtype;
begin
  select * into d from public.discounts where code = p_code::citext;

  if not found then
    return query select false, null::uuid, null::public.discount_type, null::numeric, 'Code not found';
  elsif not d.is_active then
    return query select false, null::uuid, null::public.discount_type, null::numeric, 'Code is inactive';
  elsif d.starts_at is not null and d.starts_at > now() then
    return query select false, null::uuid, null::public.discount_type, null::numeric, 'Code is not active yet';
  elsif d.expires_at is not null and d.expires_at < now() then
    return query select false, null::uuid, null::public.discount_type, null::numeric, 'Code has expired';
  elsif d.usage_limit is not null and d.times_used >= d.usage_limit then
    return query select false, null::uuid, null::public.discount_type, null::numeric, 'Code usage limit reached';
  elsif p_order_subtotal < d.min_order_amount then
    return query select false, null::uuid, null::public.discount_type, null::numeric,
      format('Order must be at least %s to use this code', d.min_order_amount);
  else
    return query select true, d.id, d.type, d.value, 'Valid';
  end if;
end;
$$;

grant execute on function public.validate_discount_code(text, numeric) to authenticated, anon;

-- -------------------------------------------------------------------------
-- Effective price helper — a variant's price_override wins over the
-- product's sale_price, which wins over its base price. Centralising this
-- avoids the same fallback logic being re-implemented (and drifting) in
-- both the storefront and the admin panel.
-- -------------------------------------------------------------------------

create or replace function public.variant_effective_price(p_variant_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(
    v.price_override,
    p.sale_price,
    p.price
  )
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.id = p_variant_id;
$$;

grant execute on function public.variant_effective_price(uuid) to authenticated, anon;
