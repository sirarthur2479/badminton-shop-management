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
    check (status in ('pending','in_progress','done','picked_up'))
);

-- Seed data: common brands
insert into racket_brands (name) values ('Yonex'),('Victor'),('Li-Ning'),('Babolat'),('Carlton');
insert into string_brands (name) values ('Yonex'),('Victor'),('Li-Ning'),('Ashaway');
