-- =========================================================================
-- GODDYS - 0012_paymaya_requires_reference.sql
-- Follow-up to 0011: now that 'paymaya_manual' exists on the
-- payment_method enum, widen the reference-number requirement so it
-- applies to either manual e-wallet option, not just GCash.
--
-- Wrapped in existence checks so this is safe to re-run if a previous
-- push already got partway through.
-- =========================================================================

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'gcash_requires_reference'
  ) then
    alter table public.orders drop constraint gcash_requires_reference;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'wallet_requires_reference'
  ) then
    alter table public.orders
      add constraint wallet_requires_reference check (
        payment_method not in ('gcash_manual', 'paymaya_manual') or payment_reference is not null
      );
  end if;
end $$;
