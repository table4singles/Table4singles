
-- ============================================================
-- 002: Ciclo de vida, notificaciones y RPCs
-- ============================================================

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

update public.profiles p set email = u.email from auth.users u where p.id = u.id and p.email is null;

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
    values (v_table.host_id, 'new_participant', 'Nuevo comensal',
      v_guest_name || ' se ha unido a tu mesa en ' || v_table.restaurant_name,
      jsonb_build_object('table_id', v_table.id));
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
  values (new.invitee_id, 'invitation', 'Nueva invitación',
    v_inviter_name || ' te ha invitado a una mesa en ' || coalesce(v_table.restaurant_name, ''),
    jsonb_build_object('table_id', new.table_id, 'invitation_id', new.id));
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
    values (new.inviter_id,
      'invitation_response',
      case when new.status = 'accepted' then 'Invitación aceptada' else 'Invitación rechazada' end,
      v_invitee_name || case when new.status = 'accepted' then ' ha aceptado tu invitación' else ' ha rechazado tu invitación' end,
      jsonb_build_object('table_id', new.table_id, 'invitation_id', new.id));
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
  values (new.host_id, 'new_review', 'Nueva valoración',
    'Has recibido una valoración de ' || new.rating || ' estrellas',
    jsonb_build_object('table_id', new.table_id));
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
    from public.table_participants where table_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_table_cancelled on public.dining_tables;
create trigger on_table_cancelled
  after update on public.dining_tables
  for each row execute procedure public.notify_table_cancelled();

create or replace function public.join_table(p_table_id uuid, p_join_type text default 'word')
returns public.table_participants as $$
declare
  v_table public.dining_tables;
  v_participant public.table_participants;
begin
  select * into v_table from public.dining_tables where id = p_table_id for update;
  if v_table is null then raise exception 'Table not found'; end if;
  if v_table.status <> 'open' then raise exception 'Table is not open'; end if;
  if v_table.available_seats <= 0 then raise exception 'No seats available'; end if;
  if v_table.host_id = auth.uid() then raise exception 'Host cannot join own table'; end if;
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

create or replace function public.cancel_reservation(p_participant_id uuid)
returns void as $$
declare
  v_participant public.table_participants;
begin
  select * into v_participant from public.table_participants where id = p_participant_id and user_id = auth.uid();
  if v_participant is null then raise exception 'Reservation not found'; end if;
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

drop policy if exists "Users can create invitations" on public.invitations;
create policy "Hosts can create invitations for their tables" on public.invitations
  for insert with check (
    auth.uid() = inviter_id
    and exists (select 1 from public.dining_tables dt where dt.id = table_id and dt.host_id = auth.uid())
  );

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_display_name_idx on public.profiles (display_name);


-- ============================================================
-- 003: Campos de onboarding
-- ============================================================

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists street_address text,
  add column if not exists province text,
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists instagram text,
  add column if not exists onboarding_completed boolean default false;


-- ============================================================
-- 004: Preferencias de ajustes
-- ============================================================

alter table public.profiles
  add column if not exists email_notifications boolean default true,
  add column if not exists push_notifications boolean default true,
  add column if not exists theme_preference text default 'light' check (theme_preference in ('light', 'dark'));


-- ============================================================
-- 005: Avatar de usuario
-- ============================================================

alter table public.profiles add column if not exists avatar_url text;


-- ============================================================
-- 006: Geolocalización
-- ============================================================

alter table public.profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists profiles_lat_lng_idx on public.profiles (latitude, longitude);


-- ============================================================
-- 007: Bloquear cambio de rol
-- ============================================================

create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if NEW.role is distinct from OLD.role then
    raise exception 'No se puede cambiar el rol de una cuenta despues de crearla';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_change();


-- ============================================================
-- 008: Sistema de referidos
-- ============================================================

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referred_by uuid;
begin
  begin
    v_referred_by := nullif(new.raw_user_meta_data->>'referred_by', '')::uuid;
  exception when others then
    v_referred_by := null;
  end;
  if v_referred_by is not null and (
    v_referred_by = new.id or not exists (select 1 from public.profiles where id = v_referred_by)
  ) then
    v_referred_by := null;
  end if;
  insert into public.profiles (id, display_name, role, email, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.email,
    v_referred_by
  );
  return new;
end;
$$ language plpgsql security definer;


-- ============================================================
-- 009: Favoritos
-- ============================================================

create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  restaurant_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, restaurant_id)
);

alter table public.favorites enable row level security;
create policy "Users can view own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "Users can add own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users can remove own favorites" on public.favorites for delete using (auth.uid() = user_id);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_restaurant_id_idx on public.favorites (restaurant_id);


-- ============================================================
-- 010: Reseñas entre comensales
-- ============================================================

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

alter table public.diner_reviews enable row level security;

create policy "Users can view own submitted diner reviews" on public.diner_reviews
  for select using (auth.uid() = reviewer_id);

create policy "Co-diners can rate each other after the dinner" on public.diner_reviews
  for insert with check (
    auth.uid() = reviewer_id
    and exists (select 1 from public.dining_tables dt where dt.id = diner_reviews.table_id and dt.date <= current_date)
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

create or replace function public.get_diner_trust_score(p_user_id uuid)
returns table(avg_rating numeric, review_count integer)
language sql security definer stable as $$
  select coalesce(avg(rating), 0)::numeric(3,2), count(*)::integer
  from public.diner_reviews where reviewee_id = p_user_id;
$$;

grant execute on function public.get_diner_trust_score(uuid) to authenticated, anon;


-- ============================================================
-- 011: Recordatorios automáticos 24h antes (requiere pg_cron activo)
