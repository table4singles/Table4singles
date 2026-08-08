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
