-- ============================================================
-- TABLE4SINGLES — SETUP COMPLETO DE BASE DE DATOS
-- Pega este script completo en el SQL Editor de Supabase y ejecuta.
-- IMPORTANTE: Antes de ejecutar, activa la extensión pg_cron en
-- Database > Extensions (busca "pg_cron" y actívala).
-- ============================================================


-- ============================================================
-- SCHEMA BASE
-- ============================================================

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  bio text,
  city text,
  country text,
  languages text[] default '{}',
  interests text[] default '{}',
  role text not null default 'user' check (role in ('user', 'restaurant')),
  is_admin boolean default false,
  word_penalised boolean default false,
  restaurant_name text,
  restaurant_cuisine text,
  restaurant_description text,
  restaurant_website text,
  restaurant_phone text,
  restaurant_price_range text default '$$',
  restaurant_photos text[] default '{}',
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.cities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  active boolean default true
);

create table public.dining_tables (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.profiles(id) on delete cascade not null,
  restaurant_name text not null,
  restaurant_address text,
  restaurant_city text not null,
  restaurant_country text not null default '',
  restaurant_image_url text,
  date date not null,
  time time not null,
  max_seats integer not null default 6,
  available_seats integer not null default 5,
  status text not null default 'open' check (status in ('open', 'full', 'completed', 'cancelled')),
  description text,
  cuisine_type text,
  languages text[],
  deposit_amount numeric(10,2) default 7.00,
  created_at timestamptz default now()
);

create table public.table_participants (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  join_type text not null default 'word' check (join_type in ('word', 'deposit')),
  deposit_paid boolean default false,
  created_at timestamptz default now(),
  unique(table_id, user_id)
);

create table public.invitations (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  invitee_id uuid references public.profiles(id) on delete cascade not null,
  payment_covered boolean default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  ambiance_rating integer check (ambiance_rating >= 1 and ambiance_rating <= 5),
  food_rating integer check (food_rating >= 1 and food_rating <= 5),
  company_rating integer check (company_rating >= 1 and company_rating <= 5),
  created_at timestamptz default now(),
  unique(table_id, reviewer_id)
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null default '',
  metadata jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create table public.refund_claims (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  stripe_session_id text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table public.vip_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text unique not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade,
  code text unique not null,
  used boolean default false,
  created_at timestamptz default now()
);

create table public.restaurant_terms_acceptance (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.profiles(id) on delete cascade not null,
  accepted_at timestamptz default now(),
  ip_address text
);

-- RLS
alter table public.profiles enable row level security;
alter table public.dining_tables enable row level security;
alter table public.table_participants enable row level security;
alter table public.invitations enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.refund_claims enable row level security;
alter table public.cities enable row level security;
alter table public.payments enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Tables are viewable by everyone" on public.dining_tables for select using (true);
create policy "Authenticated users can create tables" on public.dining_tables for insert with check (auth.uid() = host_id);
create policy "Hosts can update their tables" on public.dining_tables for update using (auth.uid() = host_id);
create policy "Participants are viewable by everyone" on public.table_participants for select using (true);
create policy "Authenticated users can join tables" on public.table_participants for insert with check (auth.uid() = user_id);
create policy "Users can update own participation" on public.table_participants for update using (auth.uid() = user_id);
create policy "Users can delete own participation" on public.table_participants for delete using (auth.uid() = user_id);
create policy "Users can view their invitations" on public.invitations for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);
create policy "Users can create invitations" on public.invitations for insert with check (auth.uid() = inviter_id);
create policy "Invitees can update invitations" on public.invitations for update using (auth.uid() = invitee_id);
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Authenticated users can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);
create policy "Messages are viewable by everyone" on public.messages for select using (true);
create policy "Authenticated users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Users can view own refund claims" on public.refund_claims for select using (auth.uid() = user_id);
create policy "Users can create refund claims" on public.refund_claims for insert with check (auth.uid() = user_id);
create policy "Cities are viewable by everyone" on public.cities for select using (true);
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);

-- Storage
insert into storage.buckets (id, name, public) values ('restaurant-photos', 'restaurant-photos', true);
create policy "Anyone can view restaurant photos" on storage.objects for select using (bucket_id = 'restaurant-photos');
create policy "Authenticated users can upload restaurant photos" on storage.objects for insert with check (bucket_id = 'restaurant-photos' and auth.role() = 'authenticated');
create policy "Users can delete own restaurant photos" on storage.objects for delete using (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime base
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.table_participants;
alter publication supabase_realtime add table public.dining_tables;


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
-- ============================================================

create extension if not exists pg_cron;

alter table public.table_participants add column if not exists reminder_sent boolean default false;
alter table public.dining_tables add column if not exists host_reminder_sent boolean default false;

create or replace function public.send_dinner_reminders()
returns void language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, type, title, body, metadata)
  select tp.user_id, 'reminder', 'Tu cena es mañana',
         'Recuerda tu cena en ' || dt.restaurant_name || ' el ' || to_char(dt.date, 'DD/MM') || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id)
  from public.table_participants tp
  join public.dining_tables dt on dt.id = tp.table_id
  where dt.status in ('open', 'full') and not tp.reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  update public.table_participants tp set reminder_sent = true
  from public.dining_tables dt where dt.id = tp.table_id
    and dt.status in ('open', 'full') and not tp.reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  insert into public.notifications (user_id, type, title, body, metadata)
  select dt.host_id, 'reminder', 'Tu mesa es mañana',
         'Mañana recibes comensales en ' || dt.restaurant_name || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id)
  from public.dining_tables dt
  where dt.status in ('open', 'full') and not dt.host_reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  update public.dining_tables dt set host_reminder_sent = true
  where dt.status in ('open', 'full') and not dt.host_reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');
end;
$$;

do $$ begin perform cron.unschedule('send_dinner_reminders_hourly'); exception when others then null; end $$;
select cron.schedule('send_dinner_reminders_hourly', '0 * * * *', $$select public.send_dinner_reminders();$$);


-- ============================================================
-- 012: Participantes también pueden invitar
-- ============================================================

drop policy if exists "Hosts can create invitations for their tables" on public.invitations;

create policy "Hosts and participants can create invitations for their tables" on public.invitations
  for insert with check (
    auth.uid() = inviter_id
    and (
      exists (select 1 from public.dining_tables dt where dt.id = table_id and dt.host_id = auth.uid())
      or exists (select 1 from public.table_participants tp where tp.table_id = invitations.table_id and tp.user_id = auth.uid() and tp.status = 'approved')
    )
  );


-- ============================================================
-- 013: Push subscriptions
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ============================================================
-- 014: Campos extra de restaurante
-- ============================================================

alter table public.profiles
  add column if not exists restaurant_hours        text    default null,
  add column if not exists restaurant_total_tables integer default null,
  add column if not exists restaurant_menu_url     text    default null,
  add column if not exists restaurant_offers       text    default null,
  add column if not exists restaurant_specialties  text[]  default null,
  add column if not exists restaurant_address      text    default null;


-- ============================================================
-- 015: Reseñas públicas del local
-- ============================================================

create table if not exists public.restaurant_reviews (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references auth.users(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz default now(),
  unique (user_id, restaurant_id)
);

alter table public.restaurant_reviews enable row level security;
create policy "Anyone can read restaurant reviews" on public.restaurant_reviews for select using (true);
create policy "Authenticated users can insert their own review" on public.restaurant_reviews for insert with check (auth.uid() = user_id);
create policy "Users can update their own review" on public.restaurant_reviews for update using (auth.uid() = user_id);
create policy "Users can delete their own review" on public.restaurant_reviews for delete using (auth.uid() = user_id);

create table if not exists public.restaurant_review_replies (
  id            uuid default gen_random_uuid() primary key,
  review_id     uuid not null references public.restaurant_reviews(id) on delete cascade,
  restaurant_id uuid not null references auth.users(id) on delete cascade,
  reply         text not null,
  created_at    timestamptz default now(),
  unique (review_id)
);

alter table public.restaurant_review_replies enable row level security;
create policy "Anyone can read review replies" on public.restaurant_review_replies for select using (true);
create policy "Restaurant can insert its own reply" on public.restaurant_review_replies for insert with check (auth.uid() = restaurant_id);
create policy "Restaurant can update its own reply" on public.restaurant_review_replies for update using (auth.uid() = restaurant_id);
create policy "Restaurant can delete its own reply" on public.restaurant_review_replies for delete using (auth.uid() = restaurant_id);


-- ============================================================
-- 016: Notificar al restaurante cuando recibe reseña del local
-- ============================================================

create or replace function public.notify_new_restaurant_review()
returns trigger as $$
declare reviewer_name text;
begin
  select coalesce(nullif(trim(display_name), ''), 'Un usuario') into reviewer_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, title, body, metadata)
  values (new.restaurant_id, 'new_restaurant_review', 'Nueva reseña',
    reviewer_name || ' te ha valorado con ' || new.rating || ' estrellas',
    jsonb_build_object('restaurant_id', new.restaurant_id, 'review_id', new.id, 'rating', new.rating));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_restaurant_review_created on public.restaurant_reviews;
create trigger on_restaurant_review_created
  after insert on public.restaurant_reviews
  for each row execute procedure public.notify_new_restaurant_review();

create or replace function public.notify_updated_restaurant_review()
returns trigger as $$
declare reviewer_name text;
begin
  if old.rating is not distinct from new.rating and old.comment is not distinct from new.comment then return new; end if;
  select coalesce(nullif(trim(display_name), ''), 'Un usuario') into reviewer_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, title, body, metadata)
  values (new.restaurant_id, 'updated_restaurant_review', 'Reseña actualizada',
    reviewer_name || ' ha actualizado su valoración a ' || new.rating || ' estrellas',
    jsonb_build_object('restaurant_id', new.restaurant_id, 'review_id', new.id, 'rating', new.rating));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_restaurant_review_updated on public.restaurant_reviews;
create trigger on_restaurant_review_updated
  after update on public.restaurant_reviews
  for each row execute procedure public.notify_updated_restaurant_review();


-- ============================================================
-- 017: Notif al restaurante cuando participante cancela;
--      Notif al usuario cuando restaurante responde su reseña;
--      RPC remove_participant
-- ============================================================

create or replace function public.notify_participant_left()
returns trigger as $$
declare
  v_table public.dining_tables;
  v_name  text;
begin
  select * into v_table from public.dining_tables where id = old.table_id;
  select coalesce(display_name, 'Un comensal') into v_name from public.profiles where id = old.user_id;
  if v_table.host_id is not null and v_table.host_id <> old.user_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (v_table.host_id, 'participant_left', 'Un comensal ha cancelado',
      v_name || ' ha cancelado su plaza en ' || v_table.restaurant_name,
      jsonb_build_object('table_id', v_table.id));
  end if;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_table_participant_deleted on public.table_participants;
create trigger on_table_participant_deleted
  after delete on public.table_participants
  for each row execute procedure public.notify_participant_left();

create or replace function public.notify_review_reply()
returns trigger as $$
declare
  v_restaurant_name  text;
  v_reviewer_user_id uuid;
begin
  select user_id into v_reviewer_user_id from public.restaurant_reviews where id = new.review_id;
  select coalesce(restaurant_name, 'El restaurante') into v_restaurant_name from public.profiles where id = new.restaurant_id;
  if v_reviewer_user_id is not null and v_reviewer_user_id <> new.restaurant_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (v_reviewer_user_id, 'review_reply', 'Respuesta a tu reseña',
      v_restaurant_name || ' ha respondido a tu reseña',
      jsonb_build_object('restaurant_id', new.restaurant_id, 'review_id', new.review_id));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_reply_created on public.restaurant_review_replies;
create trigger on_review_reply_created
  after insert on public.restaurant_review_replies
  for each row execute procedure public.notify_review_reply();

drop trigger if exists on_review_reply_updated on public.restaurant_review_replies;
create trigger on_review_reply_updated
  after update on public.restaurant_review_replies
  for each row when (old.reply is distinct from new.reply)
  execute procedure public.notify_review_reply();

create or replace function public.remove_participant(p_participant_id uuid)
returns void as $$
declare
  v_participant public.table_participants;
  v_table       public.dining_tables;
  v_name        text;
begin
  select * into v_participant from public.table_participants where id = p_participant_id;
  if v_participant is null then raise exception 'Participant not found'; end if;
  select * into v_table from public.dining_tables where id = v_participant.table_id;
  if v_table.host_id <> auth.uid() then raise exception 'Not authorized'; end if;
  select coalesce(display_name, 'Alguien') into v_name from public.profiles where id = v_participant.user_id;
  delete from public.table_participants where id = p_participant_id;
  update public.dining_tables
  set available_seats = least(max_seats, available_seats + 1),
      status = case when status = 'full' then 'open' else status end
  where id = v_participant.table_id;
  insert into public.notifications (user_id, type, title, body, metadata)
  values (v_participant.user_id, 'removed_from_table', 'Plaza cancelada por el restaurante',
    'El restaurante ha cancelado tu plaza en ' || v_table.restaurant_name,
    jsonb_build_object('table_id', v_table.id));
end;
$$ language plpgsql security definer;


-- ============================================================
-- 018: Realtime en notifications
-- ============================================================

alter publication supabase_realtime add table public.notifications;
