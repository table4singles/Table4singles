-- Stripe integration: restaurant subscriptions (€10/month) + user reservations (€2)

-- Add Stripe/subscription fields to profiles
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text
    check (subscription_status in ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid')),
  add column if not exists subscription_id text;

-- Track per-reservation payments (€2 each)
create table if not exists public.reservation_payments (
  id                      uuid default gen_random_uuid() primary key,
  user_id                 uuid references public.profiles(id) on delete cascade not null,
  table_id                uuid references public.dining_tables(id) on delete cascade not null,
  stripe_session_id       text not null unique,
  stripe_payment_intent_id text,
  amount                  integer not null default 200,   -- céntimos (€2)
  currency                text not null default 'eur',
  status                  text not null default 'pending'
    check (status in ('pending','paid','refunded','failed')),
  created_at              timestamptz default now()
);

alter table public.reservation_payments enable row level security;

create policy "Usuario ve sus propios pagos"
  on public.reservation_payments for select
  using (user_id = auth.uid());
