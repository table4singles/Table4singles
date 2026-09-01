-- Lista de espera para mesas completas (Sección 19 de la spec de producto).
-- Cuando se libera una plaza (available_seats sube), se notifica a la
-- persona más antigua de la lista que todavía no haya sido avisada — no se
-- le inscribe automáticamente, solo se le avisa para que reserve ella misma
-- (evita cobrar/comprometer una plaza sin confirmación explícita del usuario).

create table if not exists public.table_waitlist (
  id uuid default gen_random_uuid() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'joined', 'cancelled')),
  created_at timestamptz default now(),
  notified_at timestamptz,
  unique(table_id, user_id)
);

alter table public.table_waitlist enable row level security;

create policy "Usuario ve su propia lista de espera"
  on public.table_waitlist for select
  using (user_id = auth.uid());

create policy "Anfitrión ve la lista de espera de sus mesas"
  on public.table_waitlist for select
  using (exists (select 1 from public.dining_tables dt where dt.id = table_id and dt.host_id = auth.uid()));

create policy "Usuario se une a la lista de espera"
  on public.table_waitlist for insert
  with check (user_id = auth.uid());

create policy "Usuario cancela su propia entrada en la lista de espera"
  on public.table_waitlist for update
  using (user_id = auth.uid());

create policy "Usuario elimina su propia entrada en la lista de espera"
  on public.table_waitlist for delete
  using (user_id = auth.uid());

create policy "Admin ve todas las listas de espera"
  on public.table_waitlist for select
  using (public.is_admin());

-- Notifica a la siguiente persona en la lista de espera cuando se libera una plaza.
create or replace function public.notify_waitlist_on_seat_freed()
returns trigger as $$
declare
  v_next record;
begin
  if new.available_seats <= old.available_seats or new.status <> 'open' then
    return new;
  end if;

  select * into v_next
  from public.table_waitlist
  where table_id = new.id and status = 'waiting'
  order by created_at asc
  limit 1;

  if v_next.id is not null then
    update public.table_waitlist set status = 'notified', notified_at = now() where id = v_next.id;

    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_next.user_id,
      'waitlist_spot_open',
      '¡Se ha liberado una plaza!',
      'Hay una plaza libre en ' || new.restaurant_name || ' · ' || to_char(new.date, 'DD/MM') || '. Resérvala antes de que se ocupe.',
      jsonb_build_object('table_id', new.id)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_dining_table_seat_freed on public.dining_tables;
create trigger on_dining_table_seat_freed
  after update on public.dining_tables
  for each row execute procedure public.notify_waitlist_on_seat_freed();

alter publication supabase_realtime add table public.table_waitlist;

comment on table public.table_waitlist is 'Lista de espera por mesa — se notifica (no se inscribe automáticamente) a la persona más antigua cuando se libera una plaza.';
