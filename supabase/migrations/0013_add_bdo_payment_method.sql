-- =========================================================================
-- GODDYS - 0013_add_bdo_payment_method.sql
-- Adds a fourth manual payment option: BDO bank transfer. Same manual
-- flow as GCash/PayMaya (customer types in a reference number, admin
-- checks the BDO account before flipping payment_status to 'paid').
--
-- Like 0011, this ONLY adds the enum value - Postgres won't let a value
-- added in this transaction be used yet, so everything that references
-- 'bdo_manual' lives in 0014.
-- =========================================================================

alter type public.payment_method add value if not exists 'bdo_manual';
