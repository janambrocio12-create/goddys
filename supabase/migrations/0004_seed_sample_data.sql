-- =========================================================================
-- GODDYS — 0004_seed_sample_data.sql
-- OPTIONAL. Sample data so the schema can be sanity-checked end to end.
-- Safe to skip in production — remove this file (or don't run it) if you
-- don't want demo rows in a real database.
-- =========================================================================

insert into public.categories (name, slug, description, display_order)
values ('Tops', 'tops', 'Tees, hoodies, and outerwear.', 1)
on conflict (slug) do nothing;

with cat as (select id from public.categories where slug = 'tops')
insert into public.products (name, slug, description, price, sale_price, category_id, sku, status, is_featured, is_new_arrival)
select
  'GODDYS Oversized Tee',
  'goddys-oversized-tee',
  'Heavyweight 240gsm cotton, dropped shoulder, boxy fit. Garment-dyed for a lived-in finish.',
  1450.00,
  null,
  cat.id,
  'GDY-TEE-001',
  'active',
  true,
  true
from cat
on conflict (slug) do nothing;

-- One variant row per size x color combination. stock_quantity starts at
-- its default of 0 — the real total is set below via the inventory
-- ledger, since the ledger (not this column) is the source of truth.
with p as (select id from public.products where slug = 'goddys-oversized-tee')
insert into public.product_variants (product_id, size, color, sku)
select p.id, size, color, 'GDY-TEE-001-' || size || '-' || upper(left(color, 2))
from p, unnest(array['S', 'M', 'L', 'XL']) as size
cross join unnest(array['Black', 'White', 'Grey']) as color
on conflict (product_id, size, color) do nothing;

-- Record the initial stock as an inventory movement. The
-- on_inventory_movement_insert trigger applies this to
-- product_variants.stock_quantity automatically.
insert into public.inventory_movements (variant_id, movement_type, quantity_change, reason)
select id, 'restock', 25, 'Initial seed stock'
from public.product_variants
where sku like 'GDY-TEE-001-%';

insert into public.discounts (code, description, type, value, min_order_amount)
values ('GODDYS10', 'Launch discount', 'percentage', 10, 1000)
on conflict (code) do nothing;
