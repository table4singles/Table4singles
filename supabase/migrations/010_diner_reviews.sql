-- ============================================
-- 010: Reseñas entre comensales (solo puntuación agregada, sin comentarios)
-- ============================================
-- Tras una cena, los comensales (incluido el anfitrión) pueden puntuarse
-- entre si del 1 al 5. No se guarda comentario y las filas individuales
-- nunca son visibles para nadie salvo quien las escribió: solo se expone
-- una media + numero de valoraciones via una funcion (security definer).

create table if not exists public.diner_reviews (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamptz default now(),
  unique(table_id, reviewer_id, reviewee_id),
  check (reviewer_id <> reviewee_id)
);

comment on table public.diner_reviews is 'Puntuacion privada entre comensales de una misma mesa, solo se expone el agregado';

alter table public.diner_reviews enable row level security;

-- Solo el autor puede ver sus propias valoraciones enviadas (para saber a quien ya puntuo)
create policy "Users can view own submitted diner reviews" on public.diner_reviews
  for select using (auth.uid() = reviewer_id);

-- Solo se puede puntuar a alguien que compartio la misma mesa (como participante o anfitrion),
-- y solo despues de la fecha de la cena
create policy "Co-diners can rate each other after the dinner" on public.diner_reviews
  for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.dining_tables dt
      where dt.id = diner_reviews.table_id
        and dt.date <= current_date
    )
    and (
      exists (select 1 from public.table_participants tp where tp.table_id = diner_reviews.table_id and tp.user_id = diner_reviews.reviewer_id)
      or exists (select 1 from public.dining_tables dt2 where dt2.id = diner_reviews.table_id and dt2.host_id = diner_reviews.reviewer_id)
    )
    and (
      exists (select 1 from public.table_participants tp3 where tp3.table_id = diner_reviews.table_id and tp3.user_id = diner_reviews.reviewee_id)
      or exists (select 1 from public.dining_tables dt3 where dt3.id = diner_reviews.table_id and dt3.host_id = diner_reviews.reviewee_id)
    )
  );

create index if not exists diner_reviews_reviewee_idx on public.diner_reviews (reviewee_id);
create index if not exists diner_reviews_table_idx on public.diner_reviews (table_id);

-- Funcion publica que solo expone el agregado (media + numero de valoraciones),
-- nunca las filas individuales. security definer para poder leer todas las filas
-- internamente sin saltarse la RLS de arriba (que restringe el select normal al autor).
create or replace function public.get_diner_trust_score(p_user_id uuid)
returns table(avg_rating numeric, review_count integer)
language sql
security definer
stable
as $$
  select coalesce(avg(rating), 0)::numeric(3,2), count(*)::integer
  from public.diner_reviews
  where reviewee_id = p_user_id;
$$;

grant execute on function public.get_diner_trust_score(uuid) to authenticated, anon;
