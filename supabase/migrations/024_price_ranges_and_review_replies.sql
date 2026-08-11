-- ============================================================
-- 1. Actualizar rangos de precio existentes al nuevo formato
-- ============================================================
update profiles
set restaurant_price_range = case restaurant_price_range
  when '€'    then '0€-50€'
  when '€€'   then '50€-100€'
  when '€€€'  then '100€-200€'
  when '€€€€' then '+200€'
  else restaurant_price_range
end
where role = 'restaurant'
  and restaurant_price_range in ('€', '€€', '€€€', '€€€€');

-- ============================================================
-- 2. Tabla para respuestas del restaurante a valoraciones de cena
--    (reviews table = valoraciones ligadas a una dining_table)
-- ============================================================
create table if not exists public.review_replies (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  restaurant_id uuid not null references public.profiles(id) on delete cascade,
  reply       text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (review_id)   -- solo una respuesta por reseña
);

alter table public.review_replies enable row level security;

-- El restaurante puede leer y escribir sus propias respuestas
create policy "Restaurant manages own replies"
  on public.review_replies
  for all
  using (restaurant_id = auth.uid())
  with check (restaurant_id = auth.uid());

-- Cualquiera puede leer las respuestas (visibles públicamente)
create policy "Public can read review replies"
  on public.review_replies
  for select
  using (true);

-- Trigger para updated_at
create or replace function public.set_review_reply_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger review_replies_updated_at
  before update on public.review_replies
  for each row execute function public.set_review_reply_updated_at();
