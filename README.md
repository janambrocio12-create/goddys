# GODDYS — Foundation

This is the foundation for GODDYS: a database schema plus a thin Next.js
app that proves the two areas of the system (storefront, admin) and their
Supabase wiring. It deliberately stops short of a full storefront — see
"What's not here yet" below.

## Stack

- **Next.js 14** (App Router, TypeScript) — one codebase, two route groups
- **Supabase** — Postgres, Auth, and (for later) Storage
- **Tailwind CSS** — brand tokens in `tailwind.config.ts`

## Folder structure

```
supabase/
  migrations/
    0001_init_schema.sql        tables, enums, indexes
    0002_rls_policies.sql       row level security
    0003_functions_triggers.sql auto-provisioning, stock sync, discount RPC
    0004_seed_sample_data.sql   optional demo data
src/
  app/
    layout.tsx                  root layout, brand fonts
    globals.css
    (storefront)/                customer-facing area — URL: /
      layout.tsx                 header/footer shell
      page.tsx                   placeholder landing page
    admin/                       admin area — URL: /admin/*
      layout.tsx                 shared admin shell (login + protected)
      login/page.tsx             admin sign-in — /admin/login (no guard)
      (protected)/                 everything that requires an admin session
        layout.tsx                 sidebar nav + requireAdmin() guard
        dashboard/page.tsx         /admin/dashboard placeholder
  lib/
    supabase/
      client.ts                  browser client (anon key)
      server.ts                  server client (anon key, cookie-scoped)
      admin.ts                   service-role client — server-only
    auth/get-admin.ts             requireAdmin() helper
    types/database.types.ts       hand-written DB types (regenerate later)
middleware.ts                    session refresh + /admin perimeter check
```

## Database design

### Tables

| Table                | Purpose |
|-----------------------|---------|
| `categories`          | Self-referencing (`parent_id`) so sub-categories can be added without a migration. |
| `products`            | Core listing. `status` gates storefront visibility; `is_featured` / `is_new_arrival` are simple flags rather than a tagging system, since that's what was asked for — a tags table can be layered on later. |
| `product_variants`    | One row per size × color. `stock_quantity` is a cached total (see Inventory below). `price_override` lets one variant (e.g. an XXL upcharge) differ from the product price. |
| `product_images`      | Optionally tied to a `variant_id` for color-specific photography; otherwise product-wide. |
| `customers`           | 1:1 extension of `auth.users`. Auto-created on signup (see Auth below). |
| `admin_profiles`      | 1:1 extension of `auth.users` for staff. **Never** auto-created — see Auth below. |
| `orders` / `order_items` | Money amounts and the shipping/billing address are **snapshotted** at checkout, and `order_items` snapshots `product_name` / `variant_details`. This means a later price change, address edit, or even a deleted product never rewrites history. |
| `inventory_movements` | The `inventory` table, modeled as an append-only ledger (`restock`, `sale`, `return`, `adjustment`, ...) rather than a single mutable counter — see below. |
| `discounts`           | Never queried directly by the client — see `validate_discount_code()`. |

### Why an inventory ledger instead of just a stock column

`product_variants.stock_quantity` is what the storefront reads, but it's
kept in sync by a trigger (`apply_inventory_movement`) that fires on
every insert into `inventory_movements`. This gets you:

- A full audit trail of *why* stock changed (sale, restock, return, manual
  adjustment) instead of just the current number.
- A safe place to add multi-warehouse or reservation-hold support later
  (e.g. a nullable `warehouse_id` column) without touching `products` or
  `product_variants` at all.
- A guardrail: the trigger raises if a movement would push stock negative.

### Extending without restructuring

A few choices exist specifically so common next features don't require
breaking migrations:

- `categories.parent_id` — sub-categories or a full taxonomy tree.
- `product_images.variant_id` (nullable) — color-specific galleries.
- `inventory_movements` — warehouses, reservations, returns processing.
- `orders.shipping_address` / `billing_address` as `jsonb` — new address
  fields (e.g. delivery instructions) don't need a column migration.
- `customers.addresses` as a `jsonb` array — an address book without a
  join table; can be split into a real `customer_addresses` table later
  if you need per-address querying.
- `admin_profiles.role` as an enum with four levels already — new
  permission checks can match on role without a schema change.

## Row Level Security

Every table has RLS **enabled**, with an explicit allow-list of policies
— nothing is reachable by default. Two `security definer` helper
functions do the heavy lifting:

- `is_admin()` — true for any active row in `admin_profiles`.
- `is_super_admin()` — true only for `role = 'super_admin'`.

In short:

- **Public read**, no auth required: active `categories`, active
  `products` and their `product_variants` / `product_images`.
- **Customers**: can read/update only their own `customers` row, and
  read only their own `orders` / `order_items`. They cannot see other
  customers' data, and cannot read `discounts` or `admin_profiles` at all.
- **Admins**: full read/write on catalog, inventory, orders, and
  customers. Only a `super_admin` can create, edit, or deactivate other
  `admin_profiles` rows — there's no self-service path into the admin
  panel.
- **Discounts**: fully admin-only at the table level. The storefront
  validates a code through `validate_discount_code(code, subtotal)`, a
  `security definer` function that returns just enough to apply the
  discount (valid?, type, value, message) — never the underlying row,
  usage counts, or other codes.

## Auth model: customers vs. admins

Both use Supabase Auth (`auth.users`), but the two roles are deliberately
asymmetric:

- **Customers** get a `customers` row automatically on signup, via the
  `handle_new_user()` trigger on `auth.users`. Normal self-service
  sign-up is fine here.
- **Admins** are never auto-provisioned. An `admin_profiles` row must be
  inserted deliberately — in practice, by a `super_admin` using the
  service-role client (`src/lib/supabase/admin.ts`) from a trusted server
  action, not by anyone signing up through a public form. This is what
  makes "secure admin panel" actually mean something: possessing a valid
  login is not the same as being staff.

`/admin/*` is checked twice, on purpose:

1. `middleware.ts` — redirects to `/admin/login` if there's no session,
   or the session has no active `admin_profiles` row.
2. `requireAdmin()` in `(admin)/(protected)/layout.tsx` — the same check,
   run again in the Server Component itself, so no protected page ever
   trusts middleware as its only gate.

## Never exposing the service-role key

`src/lib/supabase/admin.ts` is the only place the service-role key is
used, and it's constrained three ways:

1. `import 'server-only'` — the build fails if any client bundle imports it.
2. The env var has no `NEXT_PUBLIC_` prefix, so Next.js never inlines it
   into browser JavaScript.
3. It's reserved for operations RLS genuinely can't express as the
   signed-in user (provisioning an admin, a checkout action that needs to
   validate stock/pricing and write `orders` + `order_items` +
   `inventory_movements` together, background jobs) — everything else
   should go through `lib/supabase/client.ts` or `server.ts`, which stay
   scoped to the anon key and RLS.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL + keys

# Push the schema to a Supabase project (hosted or local via `supabase start`)
npx supabase link --project-ref <your-project-ref>
npx supabase db push

npm run dev
```

Visit `/` for the storefront placeholder and `/admin/login` for the admin
area. To sign in as an admin, create an `admin_profiles` row for your
user (via the Supabase SQL editor, or a small server-side script using
`createAdminClient()`) — there is intentionally no public admin sign-up.

## Product image uploads (Cloudinary)

Product images are stored wherever `product_images.url` points — it's a
plain string, not tied to any one provider (see "Why `product_images.url`
is just a string" above the table list). The admin panel's upload button
uses Cloudinary via an **unsigned upload preset**: the browser uploads
the file directly to Cloudinary, our server never touches it, and no API
secret is ever exposed to the client.

To set it up:

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Your **Cloud name** is shown at the top of the dashboard.
3. Go to **Settings > Upload > Upload presets > Add upload preset**.
4. Set **Signing Mode** to **Unsigned**, give it a name, and save.
   Optionally restrict it further (allowed formats, max file size, a
   fixed folder) — anyone who has the cloud name + preset name can
   upload through it, so tightening the preset itself is the actual
   security boundary, not hiding these values.
5. Add both to `.env.local`:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```
6. Restart `npm run dev`.

Once configured, the "Upload from computer" control on a product's edit
page uploads straight to Cloudinary and saves the returned URL as a
`product_images` row. Pasting an existing URL still works too (useful
for images already hosted elsewhere) via the "Or add an image by URL"
toggle.

## The storefront: shop, cart, checkout

- **`/shop`** — grid of `status = 'active'` products (public read, no
  auth needed — same RLS policy the API already enforces).
- **`/products/[slug]`** — size/color picker, quantity, "Add to cart".
  Only combinations that exist as a `product_variants` row are
  selectable, and quantity is capped at that variant's live
  `stock_quantity`.
- **Cart (`/cart`)** — client-only, kept in `localStorage` via
  `src/lib/cart/cart-context.tsx`. This is convenience state, not a
  security boundary: the cart can say whatever it wants about price or
  stock, because checkout re-derives both from the database.
- **`/account/login` and `/account/signup`** — customer-facing auth,
  separate from `/admin/login`. Checkout requires a signed-in customer
  (`orders.customer_id = auth.uid()` is what RLS checks), so an
  unauthenticated visitor is redirected to log in first and sent back to
  `/checkout` afterward.
- **Checkout (`/checkout`)** — collects a shipping address and an
  optional discount code, then calls the `create_order()` Postgres
  function (added in `0005_checkout.sql`) via `supabase.rpc(...)`.

### Why checkout is one database function instead of an app-level action

`create_order()` is `SECURITY DEFINER` and does everything a checkout
needs inside a single Postgres transaction:

1. Locks each `product_variants` row being purchased (`for update`), so
   two customers checking out the last unit at the same time can't both
   succeed.
2. Re-derives every price from the database (via the same fallback
   `variant_effective_price` uses: `price_override` → `sale_price` →
   `price`) — the client-submitted cart is never trusted for money.
3. Validates the discount code through `validate_discount_code()` and
   applies it.
4. Writes the `orders` row, then every `order_items` row (snapshotting
   name/price/variant details, as always), then an `inventory_movements`
   row per item with `movement_type = 'sale'` — which the existing stock
   trigger applies to `stock_quantity` automatically.
5. If anything fails partway (out of stock, invalid discount, whatever),
   the whole function raises and the transaction rolls back — there's no
   partial order left behind.

Doing this as one function call means checkout never needs the
service-role client (`lib/supabase/admin.ts`): the privilege elevation
is scoped to this one audited function, grantable to `authenticated`
only, rather than to a whole TypeScript action. This is also why it's a
better fit than the "checkout Server Action" example originally
sketched under "Never exposing the service-role key" above — an RPC
transaction beats several sequential JS inserts for something that has
to be all-or-nothing.

### Payment isn't wired up yet

There's no payment gateway integration. Every order is created with
`payment_status = 'unpaid'`; the confirmation page tells the customer
you'll follow up. Once you've collected payment (GCash, bank transfer,
COD, or whatever you land on), open the order in `/admin/orders/[id]`
and update its payment status there — the column is already there
(`unpaid`, `paid`, `failed`, `refunded`, `partially_refunded`), it just
isn't driven by a real gateway yet.

### Cancelling an order restores stock

Setting an order's status to `cancelled` in `/admin/orders/[id]` doesn't
just flip a column — it runs `cancel_order()` (added in
`0008_cancel_order.sql`), which atomically restores stock for every item
on that order via a `return` inventory movement, the same ledger every
other stock change goes through. This only fires for `cancelled`; other
status changes (`processing`, `shipped`, `delivered`, `refunded`) are
plain column updates with no inventory side effect, since what a refund
should do to stock is a business decision this foundation doesn't
assume for you.

## What's not here yet

Per the brief, this is the foundation, not the finished product:

- No admin screen for Discounts yet (Products, Orders, and Customers are
  done; the Discounts sidebar link is a placeholder for where it'll
  live) — manage discount codes via the Supabase Table Editor for now.
- No payment gateway integration — see "Payment isn't wired up yet" above.
- No order history page for customers (`/account/orders`) — they can
  still reach an individual order's confirmation page directly by its
  order number.

The schema, RLS, and auth split above are built so that adding all of
this is additive — new tables, policies, and routes — rather than a
rewrite.
