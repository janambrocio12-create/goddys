-- =========================================================================
-- GODDYS — 0007_customer_email.sql
-- Denormalizes auth.users.email onto public.customers. Reading email
-- straight off customers keeps the admin Customers screen a plain
-- RLS-scoped query instead of needing the service-role client just to
-- resolve names to emails.
-- =========================================================================

alter table public.customers add column if not exists email text;

-- Keep it populated going forward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Backfill any customers created before this column existed.
update public.customers c
set email = u.email
from auth.users u
where c.id = u.id and c.email is null;
