-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Racket brands (Yonex, Victor, Li-Ning, Babolat...)
create table racket_brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Racket models per brand
create table racket_models (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references racket_brands(id) on delete cascade,
  name text not null,
  stock_qty integer not null default 0,
  price numeric(10,2),
  created_at timestamptz default now(),
  unique(brand_id, name)
);

-- String brands
create table string_brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

-- String models per brand, with tension guidance
create table string_models (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references string_brands(id) on delete cascade,
  name text not null,
  stock_qty integer not null default 0,
  price numeric(10,2),
  tension_min_lbs integer,
  tension_max_lbs integer,
  created_at timestamptz default now(),
  unique(brand_id, name)
);

-- Stringing orders placed by customers at the kiosk
create table stringing_orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  racket_brand_id uuid references racket_brands(id),
  racket_model_id uuid references racket_models(id),
  racket_brand_name text,   -- denormalized for display if brand not in list
  racket_model_name text,   -- denormalized for display if model not in list
  string_brand_id uuid references string_brands(id),
  string_model_id uuid references string_models(id),
  string_brand_name text,
  string_model_name text,
  tension_lbs integer not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending','in_progress','done','picked_up')),
  paid boolean not null default false
);

-- If adding to an existing database, run this instead of recreating the table:
-- alter table stringing_orders add column if not exists paid boolean not null default false;

-- Seed data: common brands
insert into racket_brands (name) values ('Yonex'),('Victor'),('Li-Ning'),('Babolat'),('Carlton')
  on conflict (name) do nothing;
insert into string_brands (name) values ('Yonex'),('Victor'),('Li-Ning'),('Ashaway')
  on conflict (name) do nothing;

-- ── Racket models ──────────────────────────────────────────────────────────────

insert into racket_models (brand_id, name, stock_qty, price)
select b.id, m.name, m.stock_qty, m.price
from racket_brands b
join (values
  -- Yonex
  ('Yonex', 'Astrox 99 Pro',       3, 349.00),
  ('Yonex', 'Astrox 88S Pro',      4, 319.00),
  ('Yonex', 'Nanoflare 1000Z',     2, 379.00),
  ('Yonex', 'Nanoflare 800',       5, 279.00),
  ('Yonex', 'Astrox 77 Pro',       4, 249.00),
  ('Yonex', 'Duora 10 LCW',        2, 209.00),
  -- Victor
  ('Victor', 'Thruster K 9900',    3, 349.00),
  ('Victor', 'Auraspeed 90X',      4, 319.00),
  ('Victor', 'Jetspeed S 12',      3, 299.00),
  ('Victor', 'Brave Sword 12',     5, 239.00),
  ('Victor', 'Drive X 09B',        4, 179.00),
  ('Victor', 'Thruster F',         3, 279.00),
  -- Li-Ning
  ('Li-Ning', 'Axforce 100',       2, 319.00),
  ('Li-Ning', 'Halbertec 9000',    2, 349.00),
  ('Li-Ning', 'Windstorm 72',      3, 279.00),
  ('Li-Ning', 'Turbo Charging 70D',4, 219.00),
  ('Li-Ning', 'Air Stream N90 III',3, 189.00),
  -- Babolat
  ('Babolat', 'Satelite Gravity 74',3, 279.00),
  ('Babolat', 'Satelite Lite',      4, 149.00),
  ('Babolat', 'X-Feel Blast',       4, 179.00),
  ('Babolat', 'I-Pulse Blast',      3, 199.00),
  -- Carlton
  ('Carlton', 'Kinesis Ultra Tour', 3, 219.00),
  ('Carlton', 'Vapour Trail Tour',  4, 199.00),
  ('Carlton', 'Airblade Tour',      3, 179.00),
  ('Carlton', 'Kinesis 73',         5, 159.00),
  ('Carlton', 'Air Shadow 9000',    3, 239.00)
) as m(brand_name, name, stock_qty, price) on b.name = m.brand_name
on conflict (brand_id, name) do nothing;

-- ── String models ──────────────────────────────────────────────────────────────

insert into string_models (brand_id, name, stock_qty, price, tension_min_lbs, tension_max_lbs)
select b.id, m.name, m.stock_qty, m.price, m.tmin, m.tmax
from string_brands b
join (values
  -- Yonex
  ('Yonex', 'BG80',          10, 22.00, 19, 30),
  ('Yonex', 'BG65',          12, 18.00, 18, 30),
  ('Yonex', 'Aerobite',       8, 28.00, 20, 30),
  ('Yonex', 'BG66 Ultimax',  10, 25.00, 18, 30),
  ('Yonex', 'Exbolt 63',      8, 25.00, 19, 30),
  -- Victor
  ('Victor', 'VBS-70',        10, 20.00, 18, 30),
  ('Victor', 'VBS-66N',        8, 22.00, 18, 29),
  ('Victor', 'VBS-63',         8, 22.00, 18, 29),
  ('Victor', 'VS-850',         6, 25.00, 18, 30),
  ('Victor', 'Thruster F Claw',5, 30.00, 19, 30),
  -- Li-Ning
  ('Li-Ning', 'No.7',          8, 22.00, 18, 30),
  ('Li-Ning', 'AP68',          8, 20.00, 18, 30),
  ('Li-Ning', 'No.5',          6, 18.00, 17, 30),
  ('Li-Ning', 'Turbo BX66',    6, 25.00, 18, 30),
  -- Ashaway
  ('Ashaway', 'Zymax 66 Fire', 6, 28.00, 18, 30),
  ('Ashaway', 'Zymax 70',      6, 25.00, 18, 30),
  ('Ashaway', 'Zymax 62',      5, 28.00, 17, 29),
  ('Ashaway', 'Rally 21',      8, 18.00, 16, 28)
) as m(brand_name, name, stock_qty, price, tmin, tmax) on b.name = m.brand_name
on conflict (brand_id, name) do nothing;
