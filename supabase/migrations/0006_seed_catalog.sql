-- =========================================================================
-- GODDYS — 0006_seed_catalog.sql
-- OPTIONAL. A fuller placeholder catalog so the storefront has enough
-- products to actually look like a shop, across a few categories.
-- Images are placehold.co placeholders in brand colors (ink/bone) — swap
-- for real product photography via the admin panel's Cloudinary upload
-- whenever it's ready. Safe to skip or delete these rows in production.
-- =========================================================================

insert into public.categories (name, slug, description, display_order)
values
  ('Bottoms', 'bottoms', 'Cargo pants, trousers, shorts.', 2),
  ('Outerwear', 'outerwear', 'Jackets and layers.', 3),
  ('Headwear', 'headwear', 'Caps and beanies.', 4)
on conflict (slug) do nothing;

-- Give the original seed tee an image too, if it doesn't have one yet.
insert into public.product_images (product_id, url, is_primary, display_order)
select id, 'https://placehold.co/800x1000/0B0B0C/EDEAE3?text=GODDYS+Oversized+Tee', true, 0
from public.products
where slug = 'goddys-oversized-tee'
  and not exists (
    select 1 from public.product_images where product_id = public.products.id
  );

-- -------------------------------------------------------------------------
-- Heavyweight Hoodie — Tops
-- -------------------------------------------------------------------------
with cat as (select id from public.categories where slug = 'tops'),
     new_product as (
       insert into public.products (name, slug, description, price, category_id, sku, status, is_featured, is_new_arrival)
       select
         'GODDYS Heavyweight Hoodie',
         'goddys-heavyweight-hoodie',
         '450gsm brushed fleece, boxy fit, dropped shoulder. Kangaroo pocket, ribbed cuffs.',
         2200.00, cat.id, 'GDY-HOOD-001', 'active', true, false
       from cat
       on conflict (slug) do nothing
       returning id
     ),
     product_ref as (
       select id from new_product
       union all
       select id from public.products where slug = 'goddys-heavyweight-hoodie'
       limit 1
     ),
     new_variants as (
       insert into public.product_variants (product_id, size, color, sku)
       select p.id, size, color, 'GDY-HOOD-001-' || size || '-' || upper(left(color, 2))
       from product_ref p, unnest(array['S','M','L','XL']) as size
       cross join unnest(array['Black','Charcoal']) as color
       on conflict (product_id, size, color) do nothing
       returning id
     )
insert into public.inventory_movements (variant_id, movement_type, quantity_change, reason)
select id, 'restock', 20, 'Initial seed stock' from new_variants;

insert into public.product_images (product_id, url, is_primary, display_order)
select id, 'https://placehold.co/800x1000/0B0B0C/EDEAE3?text=GODDYS+Hoodie', true, 0
from public.products
where slug = 'goddys-heavyweight-hoodie'
  and not exists (select 1 from public.product_images where product_id = public.products.id);

-- -------------------------------------------------------------------------
-- Cargo Pants — Bottoms
-- -------------------------------------------------------------------------
with cat as (select id from public.categories where slug = 'bottoms'),
     new_product as (
       insert into public.products (name, slug, description, price, category_id, sku, status, is_featured, is_new_arrival)
       select
         'GODDYS Cargo Pants',
         'goddys-cargo-pants',
         'Ripstop cotton, relaxed fit, six-pocket utility build with a drawcord waist.',
         2450.00, cat.id, 'GDY-CARG-001', 'active', false, true
       from cat
       on conflict (slug) do nothing
       returning id
     ),
     product_ref as (
       select id from new_product
       union all
       select id from public.products where slug = 'goddys-cargo-pants'
       limit 1
     ),
     new_variants as (
       insert into public.product_variants (product_id, size, color, sku)
       select p.id, size, color, 'GDY-CARG-001-' || size || '-' || upper(left(color, 2))
       from product_ref p, unnest(array['S','M','L','XL']) as size
       cross join unnest(array['Black','Olive']) as color
       on conflict (product_id, size, color) do nothing
       returning id
     )
insert into public.inventory_movements (variant_id, movement_type, quantity_change, reason)
select id, 'restock', 20, 'Initial seed stock' from new_variants;

insert into public.product_images (product_id, url, is_primary, display_order)
select id, 'https://placehold.co/800x1000/0B0B0C/EDEAE3?text=GODDYS+Cargo+Pants', true, 0
from public.products
where slug = 'goddys-cargo-pants'
  and not exists (select 1 from public.product_images where product_id = public.products.id);

-- -------------------------------------------------------------------------
-- Bomber Jacket — Outerwear
-- -------------------------------------------------------------------------
with cat as (select id from public.categories where slug = 'outerwear'),
     new_product as (
       insert into public.products (name, slug, description, price, sale_price, category_id, sku, status, is_featured, is_new_arrival)
       select
         'GODDYS Bomber Jacket',
         'goddys-bomber-jacket',
         'Water-resistant shell, quilted lining, ribbed collar and cuffs. Built for the commute home at 2am.',
         3800.00, 3200.00, cat.id, 'GDY-BOMB-001', 'active', true, false
       from cat
       on conflict (slug) do nothing
       returning id
     ),
     product_ref as (
       select id from new_product
       union all
       select id from public.products where slug = 'goddys-bomber-jacket'
       limit 1
     ),
     new_variants as (
       insert into public.product_variants (product_id, size, color, sku)
       select p.id, size, color, 'GDY-BOMB-001-' || size || '-' || upper(left(color, 2))
       from product_ref p, unnest(array['S','M','L','XL']) as size
       cross join unnest(array['Black','Olive']) as color
       on conflict (product_id, size, color) do nothing
       returning id
     )
insert into public.inventory_movements (variant_id, movement_type, quantity_change, reason)
select id, 'restock', 15, 'Initial seed stock' from new_variants;

insert into public.product_images (product_id, url, is_primary, display_order)
select id, 'https://placehold.co/800x1000/0B0B0C/F2C744?text=GODDYS+Bomber', true, 0
from public.products
where slug = 'goddys-bomber-jacket'
  and not exists (select 1 from public.product_images where product_id = public.products.id);

-- -------------------------------------------------------------------------
-- Crewneck Sweatshirt — Tops
-- -------------------------------------------------------------------------
with cat as (select id from public.categories where slug = 'tops'),
     new_product as (
       insert into public.products (name, slug, description, price, category_id, sku, status, is_featured, is_new_arrival)
       select
         'GODDYS Crewneck Sweatshirt',
         'goddys-crewneck-sweatshirt',
         '340gsm loopback cotton, garment-washed for a broken-in feel from day one.',
         1850.00, cat.id, 'GDY-CREW-001', 'active', false, true
       from cat
       on conflict (slug) do nothing
       returning id
     ),
     product_ref as (
       select id from new_product
       union all
       select id from public.products where slug = 'goddys-crewneck-sweatshirt'
       limit 1
     ),
     new_variants as (
       insert into public.product_variants (product_id, size, color, sku)
       select p.id, size, color, 'GDY-CREW-001-' || size || '-' || upper(left(color, 2))
       from product_ref p, unnest(array['S','M','L','XL']) as size
       cross join unnest(array['Grey','Black']) as color
       on conflict (product_id, size, color) do nothing
       returning id
     )
insert into public.inventory_movements (variant_id, movement_type, quantity_change, reason)
select id, 'restock', 20, 'Initial seed stock' from new_variants;

insert into public.product_images (product_id, url, is_primary, display_order)
select id, 'https://placehold.co/800x1000/0B0B0C/EDEAE3?text=GODDYS+Crewneck', true, 0
from public.products
where slug = 'goddys-crewneck-sweatshirt'
  and not exists (select 1 from public.product_images where product_id = public.products.id);

-- -------------------------------------------------------------------------
-- Trucker Cap — Headwear (one size)
-- -------------------------------------------------------------------------
with cat as (select id from public.categories where slug = 'headwear'),
     new_product as (
       insert into public.products (name, slug, description, price, category_id, sku, status, is_featured, is_new_arrival)
       select
         'GODDYS Trucker Cap',
         'goddys-trucker-cap',
         'Structured five-panel, mesh back, embroidered wordmark. Adjustable snapback.',
         950.00, cat.id, 'GDY-CAP-001', 'active', false, false
       from cat
       on conflict (slug) do nothing
       returning id
     ),
     product_ref as (
       select id from new_product
       union all
       select id from public.products where slug = 'goddys-trucker-cap'
       limit 1
     ),
     new_variants as (
       insert into public.product_variants (product_id, size, color, sku)
       select p.id, 'OS', color, 'GDY-CAP-001-OS-' || upper(left(color, 2))
       from product_ref p, unnest(array['Black','White']) as color
       on conflict (product_id, size, color) do nothing
       returning id
     )
insert into public.inventory_movements (variant_id, movement_type, quantity_change, reason)
select id, 'restock', 30, 'Initial seed stock' from new_variants;

insert into public.product_images (product_id, url, is_primary, display_order)
select id, 'https://placehold.co/800x1000/0B0B0C/EDEAE3?text=GODDYS+Cap', true, 0
from public.products
where slug = 'goddys-trucker-cap'
  and not exists (select 1 from public.product_images where product_id = public.products.id);
