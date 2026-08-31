-- =========================================================================
-- GODDYS — 0005_checkout.sql
-- Atomic checkout. A single SECURITY DEFINER function does everything a
-- checkout needs (price + stock validation, discount application, order
-- creation, stock deduction) inside one Postgres transaction — either
-- the whole order goes through or none of it does. This is why checkout
-- doesn't need the service-role client in application code at all: the
-- privilege elevation is scoped to this one audited function instead of
-- a whole TypeScript action.
-- =========================================================================

create sequence if not exists public.order_number_seq;

create or replace function public.create_order(
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_discount_code text,
  p_items jsonb -- [{ "variant_id": "...", "quantity": 2 }, ...]
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
begin
  if v_customer_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  -- Lock each variant row so two simultaneous checkouts can't both
  -- oversell the last unit, then price and validate every line.
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

  -- Apply a discount code, if one was given, against the now-known subtotal.
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
    total_amount, shipping_address, billing_address
  )
  values (
    v_order_number, v_customer_id, 'pending', 'unpaid',
    v_subtotal, v_discount_id, v_discount_amount, 0, 0,
    greatest(v_subtotal - v_discount_amount, 0), p_shipping_address, p_billing_address
  )
  returning id into v_order_id;

  -- Second pass: now that the order exists, write its line items and
  -- deduct stock. Re-reading each variant is deliberate — the row lock
  -- from the first loop is still held (same transaction), so the price
  -- and stock we act on here are guaranteed unchanged since we checked.
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

grant execute on function public.create_order(jsonb, jsonb, text, jsonb) to authenticated;
