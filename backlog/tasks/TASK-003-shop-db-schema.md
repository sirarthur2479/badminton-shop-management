# TASK-003 — DB schema: shop_products + shop_settings tables with seed data

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** —
**Effort:** S
**Risk:** low
**Status:** todo

## Goal

Add `shop_products` and `shop_settings` tables to `supabase/schema.sql`. Seed with 10–15 realistic products (Yonex Astrox 99, Victor bags, BG80 string packs, etc.) and a default `shop_settings` row so the `/shop` page renders immediately without the owner configuring anything first. The `shop_inquiries` table is deferred to Phase C (TASK-011).

## Acceptance criteria

- [ ] `supabase/schema.sql` contains CREATE TABLE for `shop_products` and `shop_settings`
- [ ] `shop_products` columns: id, created_at, name, category, price, sale_price, sale_ends_at, description, image_url, visible
- [ ] `shop_settings` has a single seeded row with defaults: shop_name='Badminton Pro Shop', accent_colour='green'
- [ ] `shop_products` seed includes ≥10 products across ≥4 categories (racket, string, bag, grip or similar)
- [ ] All seed products have realistic NZD prices and at least one has a `sale_price` set (to test sale badge in TASK-004)
- [ ] Running the schema SQL in a fresh Supabase project produces the tables and seed data without errors
- [ ] Existing tables (`racket_brands`, `racket_models`, `string_brands`, `string_models`, `stringing_orders`) are unchanged

## Test plan

```
shop-schema.test.js  (integration — runs against local Supabase or checks SQL syntax)

- shop_products table has all required columns
- shop_settings table has exactly one row after seed
- seed products cover at least 4 distinct categories
- one seed product has sale_price set
- existing stringing_orders table unaffected (select count works)
```

## Implementation plan

### 1. Add to `supabase/schema.sql` after existing table definitions

```sql
-- ─── shop_products ────────────────────────────────────────────────────────────
create table if not exists shop_products (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null,
  category      text not null check (category in ('racket','string','shoe','bag','grip','shuttle','other')),
  price         numeric(10,2),
  sale_price    numeric(10,2),
  sale_ends_at  timestamptz,
  description   text,
  image_url     text,
  visible       boolean default true
);

-- ─── shop_settings (single row) ───────────────────────────────────────────────
create table if not exists shop_settings (
  id             uuid primary key default gen_random_uuid(),
  shop_name      text not null default 'Badminton Pro Shop',
  tagline        text default 'Your local badminton specialist',
  phone          text,
  email          text,
  accent_colour  text default 'green',
  about          text
);
```

### 2. Seed shop_settings
```sql
insert into shop_settings (shop_name, tagline, accent_colour)
values ('Badminton Pro Shop', 'Your local badminton specialist', 'green');
```

### 3. Seed shop_products (10–15 rows)
Representative products:
- Yonex Astrox 99 (racket, $299)
- Yonex Nanoflare 1000Z (racket, $349)
- Victor Thruster K (racket, $229)
- Li-Ning Axforce 100 (racket, $199, sale_price $179)
- Yonex BG80 String (string, $18)
- Yonex Aerobite (string, $22)
- Victor Magan 9 Bag (bag, $149)
- Yonex Sunr 22012CH Bag (bag, $99)
- Yonex AC102 Overgrip 3-pack (grip, $12)
- Yonex Mavis 350 Shuttlecocks 6-pack (shuttle, $32)
- Yonex SHB65Z Shoes (shoe, $189)
- Victor SH-A960 Shoes (shoe, $159)

Use realistic placeholder image URLs from product manufacturer sites or leave image_url null for now.

### 4. Verify
Paste the new SQL block into a test Supabase SQL editor and confirm it runs without errors. The `if not exists` guards prevent conflicts if the schema is re-run.
