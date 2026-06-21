create extension if not exists pgcrypto;

create table if not exists public.festival_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stall_id text not null,
  stall_name text not null,
  menu_id text not null,
  menu_key text not null,
  menu_name text not null,
  price integer not null check (price >= 0),
  sequence_no bigint not null,
  order_number text not null unique,
  status text not null default '未' check (status in ('未', '受け取り済')),
  canceled boolean not null default false
);

create index if not exists festival_orders_created_at_idx on public.festival_orders (created_at);
create index if not exists festival_orders_stall_id_idx on public.festival_orders (stall_id);
create index if not exists festival_orders_status_idx on public.festival_orders (status, canceled);

create table if not exists public.festival_sequences (
  stall_id text primary key,
  last_value bigint not null default 0 check (last_value >= 0)
);

create table if not exists public.festival_menu_state (
  menu_key text primary key,
  stopped boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.festival_notifications (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.festival_orders enable row level security;
alter table public.festival_sequences enable row level security;
alter table public.festival_menu_state enable row level security;
alter table public.festival_notifications enable row level security;

revoke all on table public.festival_orders from anon, authenticated;
revoke all on table public.festival_sequences from anon, authenticated;
revoke all on table public.festival_menu_state from anon, authenticated;
revoke all on table public.festival_notifications from anon, authenticated;

create or replace function public.create_festival_orders(items jsonb)
returns setof public.festival_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  next_seq bigint;
  inserted public.festival_orders;
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'items must be a non-empty array';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    if coalesce(item->>'stall_id', '') = '' or coalesce(item->>'menu_id', '') = '' then
      raise exception 'stall_id and menu_id are required';
    end if;

    insert into public.festival_sequences(stall_id, last_value)
    values (item->>'stall_id', 1)
    on conflict (stall_id) do update
      set last_value = public.festival_sequences.last_value + 1
    returning last_value into next_seq;

    insert into public.festival_orders(
      stall_id, stall_name, menu_id, menu_key, menu_name, price,
      sequence_no, order_number
    ) values (
      item->>'stall_id', item->>'stall_name', item->>'menu_id', item->>'menu_key',
      item->>'menu_name', (item->>'price')::integer, next_seq,
      (item->>'stall_id') || '-' || lpad(next_seq::text, 3, '0') || '-' || (item->>'menu_id')
    ) returning * into inserted;

    return next inserted;
  end loop;
end;
$$;

create or replace function public.reset_festival_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table public.festival_orders, public.festival_sequences, public.festival_menu_state, public.festival_notifications;
end;
$$;

revoke all on function public.create_festival_orders(jsonb) from public, anon, authenticated;
revoke all on function public.reset_festival_data() from public, anon, authenticated;
