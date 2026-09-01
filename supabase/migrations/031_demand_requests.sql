-- "Avísame" — usuarios piden que se les notifique cuando aparezca una mesa
-- que encaje con sus preferencias (ciudad/fecha/horario/cocina/intereses/idioma).
-- Sección 16-18 de la especificación de producto (2026-09-01).

create table if not exists public.demand_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  city text not null,
  date_pref date,              -- fecha concreta si la dio, null si es "cualquier día"
  day_of_week int check (day_of_week between 0 and 6),  -- preferencia de día de la semana en general
  time_pref text check (time_pref in ('midday', 'evening') or time_pref is null),
  cuisine text,
  interests text[] default '{}',
  language text,
  status text not null default 'active' check (status in ('active', 'matched', 'expired', 'cancelled')),
  created_at timestamptz default now()
);

alter table public.demand_requests enable row level security;

create policy "Usuario ve sus propias peticiones de demanda"
  on public.demand_requests for select
  using (user_id = auth.uid());

create policy "Usuario crea sus propias peticiones de demanda"
  on public.demand_requests for insert
  with check (user_id = auth.uid());

create policy "Usuario actualiza/cancela sus propias peticiones de demanda"
  on public.demand_requests for update
  using (user_id = auth.uid());

create policy "Admin ve todas las peticiones de demanda"
  on public.demand_requests for select
  using (public.is_admin());

comment on table public.demand_requests is '"Avísame" — solicitudes de usuarios para ser notificados cuando aparezca una mesa que encaje con sus preferencias.';
