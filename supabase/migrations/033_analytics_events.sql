-- Eventos de producto (Sección 60-65 de la spec) — fundamento de medición del
-- funnel principal. Sin dashboard todavía (eso es P1); solo captura de eventos.
-- A diferencia de `notifications`, aquí SÍ se permite insert directo desde el
-- cliente porque no hay lógica sensible que proteger (solo analítica propia).

create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.analytics_events enable row level security;

create policy "Cualquiera autenticado inserta sus propios eventos"
  on public.analytics_events for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Admin ve todos los eventos"
  on public.analytics_events for select
  using (public.is_admin());

create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id, created_at desc);

comment on table public.analytics_events is 'Eventos de producto del funnel principal (Sección 60 de la spec) — sin dashboard todavía, solo captura.';
