-- Table4Singles — Migración 002
-- Ciclo de vida de mesas: notificaciones automáticas, unión/cancelación atómica,
-- búsqueda de usuarios para invitar y refuerzo de seguridad en invitaciones.
-- Ejecuta este script completo en el SQL Editor de Supabase (Run without RLS no es necesario aquí).

-- ============================================
-- 1. Añadir email a profiles (para poder buscar e invitar usuarios)
-- ============================================
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill de perfiles ya existentes
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ============================================
-- 2. Notificaciones automáticas (triggers, bypassan RLS al ser security definer)
-- ============================================

create or replace function public.notify_new_participant()
returns trigger as $$
declare
  v_table public.dining_tables;
  v_guest_name text;
begin
  select * into v_table from public.dining_tables where id = new.table_id;
  select coalesce(display_name, 'Alguien') into v_guest_name from public.profiles where id = new.user_id;
  if v_table.host_id is not null and v_table.host_id <> new.user_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_table.host_id,
      'new_participant',
      'Nuevo comensal',
      v_guest_name || ' se ha unido a tu mesa en ' || v_table.restaurant_name,
      jsonb_build_object('table_id', v_table.id)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_table_participant_created on public.table_participants;
create trigger on_table_participant_created
  after insert on public.table_participants
  for each row execute procedure public.notify_new_participant();

create or replace function public.notify_invitation_received()
returns trigger as $$
declare
  v_table public.dining_tables;
  v_inviter_name text;
begin
  select * into v_table from public.dining_tables where id = new.table_id;
  select coalesce(display_name, 'Alguien') into v_inviter_name from public.profiles where id = new.inviter_id;
  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.invitee_id,
    'invitation',
    'Nueva invitación',
    v_inviter_name || ' te ha invitado a una mesa en ' || coalesce(v_table.restaurant_name, ''),
    jsonb_build_object('table_id', new.table_id, 'invitation_id', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_invitation_created on public.invitations;
create trigger on_invitation_created
  after insert on public.invitations
  for each row execute procedure public.notify_invitation_received();

create or replace function public.notify_invitation_response()
returns trigger as $$
declare
  v_invitee_name text;
begin
  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    select coalesce(display_name, 'Alguien') into v_invitee_name from public.profiles where id = new.invitee_id;
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.inviter_id,
      'invitation_response',
      case when new.status = 'accepted' then 'Invitación aceptada' else 'Invitación rechazada' end,
      v_invitee_name || case when new.status = 'accepted' then ' ha aceptado tu invitación' else ' ha rechazado tu invitación' end,
      jsonb_build_object('table_id', new.table_id, 'invitation_id', new.id)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_invitation_updated on public.invitations;
create trigger on_invitation_updated
  after update on public.invitations
  for each row execute procedure public.notify_invitation_response();

create or replace function public.notify_new_review()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.host_id,
    'new_review',
    'Nueva valoración',
    'Has recibido una valoración de ' || new.rating || ' estrellas',
    jsonb_build_object('table_id', new.table_id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.notify_new_review();

create or replace function public.notify_table_cancelled()
returns trigger as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    insert into public.notifications (user_id, type, title, body, metadata)
    select user_id, 'table_cancelled', 'Mesa cancelada',
           'La mesa en ' || new.restaurant_name || ' ha sido cancelada por el anfitrión',
           jsonb_build_object('table_id', new.id)
    from public.table_participants
    where table_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_table_cancelled on public.dining_tables;
create trigger on_table_cancelled
  after update on public.dining_tables
  for each row execute procedure public.notify_table_cancelled();

-- ============================================
-- 3. Unirse a una mesa de forma atómica (evita sobre-reservar plazas)
-- ============================================
create or replace function public.join_table(p_table_id uuid, p_join_type text default 'word')
returns public.table_participants as $$
declare
  v_table public.dining_tables;
  v_participant public.table_participants;
begin
  select * into v_table from public.dining_tables where id = p_table_id for update;

  if v_table is null then
    raise exception 'Table not found';
  end if;
  if v_table.status <> 'open' then
    raise exception 'Table is not open';
  end if;
  if v_table.available_seats <= 0 then
    raise exception 'No seats available';
  end if;
  if v_table.host_id = auth.uid() then
    raise exception 'Host cannot join own table';
  end if;

  insert into public.table_participants (table_id, user_id, status, join_type, deposit_paid)
  values (p_table_id, auth.uid(), 'approved', p_join_type, false)
  returning * into v_participant;

  update public.dining_tables
  set available_seats = available_seats - 1,
      status = case when available_seats - 1 <= 0 then 'full' else 'open' end
  where id = p_table_id;

  return v_participant;
end;
$$ language plpgsql security definer;

-- ============================================
-- 4. Cancelar una reserva de forma atómica (libera la plaza)
-- ============================================
create or replace function public.cancel_reservation(p_participant_id uuid)
returns void as $$
declare
  v_participant public.table_participants;
begin
  select * into v_participant from public.table_participants where id = p_participant_id and user_id = auth.uid();

  if v_participant is null then
    raise exception 'Reservation not found';
  end if;

  delete from public.table_participants where id = p_participant_id;

  update public.dining_tables
  set available_seats = least(max_seats, available_seats + 1),
      status = case when status = 'full' then 'open' else status end
  where id = v_participant.table_id;

  if v_participant.deposit_paid then
    insert into public.refund_claims (table_id, user_id, reason, status)
    values (v_participant.table_id, auth.uid(), 'Cancelación de reserva con depósito', 'pending');
  end if;
end;
$$ language plpgsql security definer;

-- ============================================
-- 5. Refuerzo de seguridad: solo el anfitrión puede invitar a su propia mesa
-- ============================================
drop policy if exists "Users can create invitations" on public.invitations;
create policy "Hosts can create invitations for their tables" on public.invitations
  for insert with check (
    auth.uid() = inviter_id
    and exists (select 1 from public.dining_tables dt where dt.id = table_id and dt.host_id = auth.uid())
  );

-- ============================================
-- 6. Permitir buscar perfiles por email/nombre para invitar (ya cubierto por
--    la política "Profiles are viewable by everyone", solo confirmamos el índice)
-- ============================================
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_display_name_idx on public.profiles (display_name);
