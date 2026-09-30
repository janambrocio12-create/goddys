-- =========================================================================
-- GODDYS - 0010_payment_method.sql
-- Interim manual-payment support: no payment gateway account exists yet,
-- so checkout offers Cash on Delivery or a manual GCash transfer. For the
-- GCash path the customer types in the reference number from their GCash
-- app, the order is stamped "unpaid" as before, and an admin confirms the
-- transfer by eye (GCash app vs. the reference shown on the order) before
-- flipping payment_status to 'paid'. Swapping in a real gateway later is
-- additive: a new payment_method value plus a webhook that calls the same
-- updatePaymentStatus path - none of this needs to change.
-- =========================================================================

create type public.payment_method as enum ('cod', 'gcash_manual');

alter table public.orders
  add column payment_method public.payment_method not null default 'cod',
  add column payment_reference text;

alter table public.orders
  add constraint gcash_requires_reference check (
    payment_method <> 'gcash_manual' or payment_reference is not null
  );

drop function if exists public.create_order(jsonb, jsonb, text, jsonb);

create or replace function public.create_order(
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_discount_code text,
  p_items jsonb,
  p_payment_method text default 'cod',
  p_payment_reference text default null
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_discount_amount numeric(10,2) := 0;
  v_discount_id uuid;
  v_item jsonb;
  v_variant record;
  v_line_total numeric(10,2);
  v_quantity integer;
  v_discount_check record;
  v_payment_method public.payment_method;
  v_payment_reference text := nullif(trim(coalesce(p_payment_reference, '')), '');
begin
  if v_customer_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  -- Guarantee the FK target exists. If the auth.users trigger already
  -- created this row (the normal path), this is a no-op.
  insert into public.customers (id, email)
  select v_customer_id, u.email
  from auth.users u
  where u.id = v_customer_id
  on conflict (id) do nothing;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  begin
    v_payment_method := coalesce(p_payment_method, 'cod')::public.payment_method;
  exception when invalid_text_representation then
    raise exception 'Unrecognized payment method.';
  end;

  if v_payment_method = 'gcash_manual' and v_payment_reference is null then
    raise exception 'Enter your GCash reference number to continue.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity for one of the items in your cart.';
    end if;

    select v.id, v.stock_quantity, v.product_id, v.size, v.color, v.sku,
           coalesce(v.price_override, p.sale_price, p.price) as effective_price,
           p.name as product_name, p.status as product_status
    into v_variant
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = (v_item ->> 'variant_id')::uuid
    for update of v;

    if not found then
      raise exception 'One of the items in your cart no longer exists.';
    end if;

    if v_variant.product_status <> 'active' then
      raise exception '% is no longer available.', v_variant.product_name;
    end if;

    if v_variant.stock_quantity < v_quantity then
      raise exception 'Only % left in stock for % (% / %).',
        v_variant.stock_quantity, v_variant.product_name, v_variant.size, v_variant.color;
    end if;

    v_line_total := v_variant.effective_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if p_discount_code is not null and length(trim(p_discount_code)) > 0 then
    select * into v_discount_check
    from public.validate_discount_code(p_discount_code, v_subtotal)
    limit 1;

    if not v_discount_check.is_valid then
      raise exception '%', v_discount_check.message;
    end if;

    v_discount_id := v_discount_check.discount_id;
    v_discount_amount := case v_discount_check.type
      when 'percentage' then round(v_subtotal * v_discount_check.value / 100, 2)
      when 'fixed_amount' then least(v_discount_check.value, v_subtotal)
      else 0
    end;
  end if;

  v_order_number := 'GDY-' || to_char(now(), 'YYYYMMDD') || '-'
    || lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_number, customer_id, status, payment_status,
    subtotal, discount_id, discount_amount, shipping_amount, tax_amount,
    total_amount, shipping_address, billing_address,
    payment_method, payment_reference
  )
  values (
    v_order_number, v_customer_id, 'pending', 'unpaid',
    v_subtotal, v_discount_id, v_discount_amount, 0, 0,
    greatest(v_subtotal - v_discount_amount, 0), p_shipping_address, p_billing_address,
    v_payment_method, v_payment_reference
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    select v.id, v.product_id, v.size, v.color, v.sku,
           coalesce(v.price_override, p.sale_price, p.price) as effective_price,
           p.name as product_name
    into v_variant
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = (v_item ->> 'variant_id')::uuid;

    insert into public.order_items (
      order_id, product_variant_id, product_name, variant_details,
      unit_price, quantity, subtotal
    )
    values (
      v_order_id, v_variant.id, v_variant.product_name,
      jsonb_build_object('size', v_variant.size, 'color', v_variant.color, 'sku', v_variant.sku),
      v_variant.effective_price, v_quantity, v_variant.effective_price * v_quantity
    );

    insert into public.inventory_movements (
      variant_id, movement_type, quantity_change, reference_order_id, reason
    )
    values (
      v_variant.id, 'sale', -v_quantity, v_order_id, 'Order ' || v_order_number
    );
  end loop;

  if v_discount_id is not null then
    update public.discounts set times_used = times_used + 1 where id = v_discount_id;
  end if;

  return query select v_order_id, v_order_number;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text, jsonb, text, text) to authenticated;
