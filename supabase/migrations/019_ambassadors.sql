-- Tabla de embajadores de Table4Singles
create table if not exists public.ambassadors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  status text default 'active' check (status in ('active', 'inactive')),
  commission_rate numeric(4,2) default 5.00,
  applied_at timestamptz default now()
);

alter table public.ambassadors enable row level security;

create policy "Embajador puede ver su propio registro"
  on public.ambassadors for select
  using (user_id = auth.uid());

create policy "Usuario puede registrarse como embajador"
  on public.ambassadors for insert
  with check (user_id = auth.uid());

create policy "Embajador puede actualizar su propio registro"
  on public.ambassadors for update
  using (user_id = auth.uid());
