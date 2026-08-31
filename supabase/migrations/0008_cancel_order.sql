-- =========================================================================
-- GODDYS — 0008_cancel_order.sql
-- Cancelling an order is more than an UPDATE — stock sold against it
-- needs to come back. This function does both atomically, the same way
-- create_order() does for placing one, so there's one authoritative place
-- this logic lives instead of an app-level action trying to coordinate
-- an UPDATE plus N inventory inserts itself.
-- =========================================================================

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can cancel an order.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Order is already cancelled.';
  end if;

  if v_order.status in ('delivered', 'refunded') then
    raise exception 'A % order cannot be cancelled — use a refund process instead.', v_order.status;
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;

  for v_item in
    select product_variant_id, quantity
    from public.order_items
    where order_id = p_order_id and product_variant_id is not null
  loop
    insert into public.inventory_movements (
      variant_id, movement_type, quantity_change, reference_order_id, reason
    )
    values (
      v_item.product_variant_id, 'return', v_item.quantity, p_order_id,
      'Order ' || v_order.order_number || ' cancelled'
    );
  end loop;
end;
$$;

grant execute on function public.cancel_order(uuid) to authenticated;
