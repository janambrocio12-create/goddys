-- =========================================================================
-- GODDYS - 0011_add_paymaya_payment_method.sql
-- Adds a third manual payment option: PayMaya, alongside the existing
-- Cash on Delivery and GCash options. Same manual-verification flow as
-- GCash (customer types in a reference number, admin eyeballs the
-- PayMaya app before flipping payment_status to 'paid').
--
-- This migration ONLY adds the new enum value. Postgres will not let a
-- freshly-added enum value be used (e.g. in a CHECK constraint) inside
-- the same transaction it was added in, so the constraint update that
-- actually uses 'paymaya_manual' lives in the next migration file.
--
-- IF NOT EXISTS makes this safe to re-run if a previous push already
-- got this far before failing on a later statement.
-- =========================================================================

alter type public.payment_method add value if not exists 'paymaya_manual';
