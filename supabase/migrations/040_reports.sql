-- Sistema de denuncias v1 (solo denunciar, revisión manual por el admin -- sin
-- bloqueo automático, decisión del usuario 2026-09-02). Alcance: un comensal
-- participante de una mesa puede denunciar al restaurante (host) de esa mesa, y
-- un restaurante puede denunciar a un comensal de su propia mesa. No cubre
-- comensal-a-comensal en esta v1.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.dining_tables(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('no_show', 'inappropriate_behavior', 'safety_concern', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_table_id_idx on public.reports (table_id);

alter table public.reports enable row level security;

-- Un comensal participante puede denunciar al restaurante (host) de esa mesa.
create policy "Participants can report the table host" on public.reports
  for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1 from public.dining_tables dt
      join public.table_participants tp on tp.table_id = dt.id
      where dt.id = table_id
        and dt.host_id = reported_id
        and tp.user_id = auth.uid()
    )
  );

-- Un restaurante puede denunciar a un comensal de su propia mesa.
create policy "Hosts can report their participants" on public.reports
  for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1 from public.dining_tables dt
      join public.table_participants tp on tp.table_id = dt.id
      where dt.id = table_id
        and dt.host_id = auth.uid()
        and tp.user_id = reported_id
    )
  );

-- Solo el admin puede leer y gestionar las denuncias (revisión manual).
create policy "Admins can view all reports" on public.reports
  for select
  using (public.is_admin());

create policy "Admins can update reports" on public.reports
  for update
  using (public.is_admin());

comment on table public.reports is 'Denuncias comensal<->restaurante, v1 solo-denunciar sin bloqueo automático. Revisión manual desde el panel de Admin.';
