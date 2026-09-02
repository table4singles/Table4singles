-- Las notificaciones generadas por triggers SQL siempre escribían title/body en
-- español fijo, sin traducir al idioma elegido por el usuario. Esta migración no
-- cambia el mecanismo (los triggers siguen siendo la única fuente), pero enriquece
-- `metadata` con los datos crudos (nombre, restaurante, fecha, hora, rating, ciudad)
-- que el frontend necesita para reconstruir title/body traducidos por `type` en
-- NotificationsPanel.tsx. title/body se mantienen en español como fallback (para
-- notificaciones antiguas ya guardadas, o si `type` no está soportado en el panel).
--
-- Se usan claves de metadata consistentes entre tipos: name, restaurant, rating,
-- date, time, city — evita 15 formatos de metadata distintos en el frontend.
-- 'reminder' se separa en 'reminder_guest'/'reminder_host' e 'invitation_response'
-- en 'invitation_accepted'/'invitation_declined' porque cada uno necesita un
-- title/body distinto (verificado que `type` no se usa en ningún otro sitio del
-- código además de guardarse, es seguro renombrar valores).

-- ============================================================
-- 002: notify_new_participant, notify_invitation_received,
--      notify_invitation_response, notify_new_review, notify_table_cancelled
-- ============================================================

create or replace function public.notify_new_participant()
returns trigger as $$
declare
  v_table public.dining_tables;
  v_guest_name text;
begin
  select * into v_table from public.dining_tables where id = new.table_id;
  select display_name into v_guest_name from public.profiles where id = new.user_id;
  if v_table.host_id is not null and v_table.host_id <> new.user_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_table.host_id,
      'new_participant',
      'Nuevo comensal',
      coalesce(v_guest_name, 'Alguien') || ' se ha unido a tu mesa en ' || v_table.restaurant_name,
      jsonb_build_object('table_id', v_table.id, 'name', v_guest_name, 'restaurant', v_table.restaurant_name)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_invitation_received()
returns trigger as $$
declare
  v_table public.dining_tables;
  v_inviter_name text;
begin
  select * into v_table from public.dining_tables where id = new.table_id;
  select display_name into v_inviter_name from public.profiles where id = new.inviter_id;
  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.invitee_id,
    'invitation',
    'Nueva invitación',
    coalesce(v_inviter_name, 'Alguien') || ' te ha invitado a una mesa en ' || coalesce(v_table.restaurant_name, ''),
    jsonb_build_object('table_id', new.table_id, 'invitation_id', new.id, 'name', v_inviter_name, 'restaurant', v_table.restaurant_name)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_invitation_response()
returns trigger as $$
declare
  v_invitee_name text;
begin
  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    select display_name into v_invitee_name from public.profiles where id = new.invitee_id;
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.inviter_id,
      case when new.status = 'accepted' then 'invitation_accepted' else 'invitation_declined' end,
      case when new.status = 'accepted' then 'Invitación aceptada' else 'Invitación rechazada' end,
      coalesce(v_invitee_name, 'Alguien') || case when new.status = 'accepted' then ' ha aceptado tu invitación' else ' ha rechazado tu invitación' end,
      jsonb_build_object('table_id', new.table_id, 'invitation_id', new.id, 'name', v_invitee_name)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_new_review()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.host_id,
    'new_review',
    'Nueva valoración',
    'Has recibido una valoración de ' || new.rating || ' estrellas',
    jsonb_build_object('table_id', new.table_id, 'rating', new.rating)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_table_cancelled()
returns trigger as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    insert into public.notifications (user_id, type, title, body, metadata)
    select user_id, 'table_cancelled', 'Mesa cancelada',
           'La mesa en ' || new.restaurant_name || ' ha sido cancelada por el anfitrión',
           jsonb_build_object('table_id', new.id, 'restaurant', new.restaurant_name)
    from public.table_participants
    where table_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 011: send_dinner_reminders — 'reminder' se separa en guest/host
-- ============================================================

create or replace function public.send_dinner_reminders()
returns void
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, type, title, body, metadata)
  select tp.user_id, 'reminder_guest', 'Tu cena es mañana',
         'Recuerda tu cena en ' || dt.restaurant_name || ' el ' || to_char(dt.date, 'DD/MM') || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id, 'restaurant', dt.restaurant_name, 'date', dt.date, 'time', to_char(dt.time, 'HH24:MI'))
  from public.table_participants tp
  join public.dining_tables dt on dt.id = tp.table_id
  where dt.status in ('open', 'full')
    and not tp.reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  update public.table_participants tp
  set reminder_sent = true
  from public.dining_tables dt
  where dt.id = tp.table_id
    and dt.status in ('open', 'full')
    and not tp.reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  insert into public.notifications (user_id, type, title, body, metadata)
  select dt.host_id, 'reminder_host', 'Tu mesa es mañana',
         'Mañana recibes comensales en ' || dt.restaurant_name || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id, 'restaurant', dt.restaurant_name, 'time', to_char(dt.time, 'HH24:MI'))
  from public.dining_tables dt
  where dt.status in ('open', 'full')
    and not dt.host_reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  update public.dining_tables dt
  set host_reminder_sent = true
  where dt.status in ('open', 'full')
    and not dt.host_reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');
end;
$$;

-- ============================================================
-- 016: notify_new_restaurant_review, notify_updated_restaurant_review
-- ============================================================

create or replace function public.notify_new_restaurant_review()
returns trigger as $$
declare
  reviewer_name text;
begin
  select nullif(trim(display_name), '') into reviewer_name from public.profiles where id = new.user_id;

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.restaurant_id,
    'new_restaurant_review',
    'Nueva reseña',
    coalesce(reviewer_name, 'Un usuario') || ' te ha valorado con ' || new.rating || ' estrellas',
    jsonb_build_object('restaurant_id', new.restaurant_id, 'review_id', new.id, 'rating', new.rating, 'name', reviewer_name)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_updated_restaurant_review()
returns trigger as $$
declare
  reviewer_name text;
begin
  if old.rating is not distinct from new.rating
     and old.comment is not distinct from new.comment then
    return new;
  end if;

  select nullif(trim(display_name), '') into reviewer_name from public.profiles where id = new.user_id;

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.restaurant_id,
    'updated_restaurant_review',
    'Reseña actualizada',
    coalesce(reviewer_name, 'Un usuario') || ' ha actualizado su valoración a ' || new.rating || ' estrellas',
    jsonb_build_object('restaurant_id', new.restaurant_id, 'review_id', new.id, 'rating', new.rating, 'name', reviewer_name)
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 017: notify_participant_left, notify_review_reply, remove_participant
-- ============================================================

create or replace function public.notify_participant_left()
returns trigger as $$
declare
  v_table  public.dining_tables;
  v_name   text;
begin
  select * into v_table from public.dining_tables where id = old.table_id;
  select display_name into v_name from public.profiles where id = old.user_id;

  if v_table.host_id is not null and v_table.host_id <> old.user_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_table.host_id,
      'participant_left',
      'Un comensal ha cancelado',
      coalesce(v_name, 'Un comensal') || ' ha cancelado su plaza en ' || v_table.restaurant_name,
      jsonb_build_object('table_id', v_table.id, 'name', v_name, 'restaurant', v_table.restaurant_name)
    );
  end if;
  return old;
end;
$$ language plpgsql security definer;

create or replace function public.notify_review_reply()
returns trigger as $$
declare
  v_restaurant_name  text;
  v_reviewer_user_id uuid;
begin
  select user_id into v_reviewer_user_id from public.restaurant_reviews where id = new.review_id;
  select restaurant_name into v_restaurant_name from public.profiles where id = new.restaurant_id;

  if v_reviewer_user_id is not null and v_reviewer_user_id <> new.restaurant_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_reviewer_user_id,
      'review_reply',
      'Respuesta a tu reseña',
      coalesce(v_restaurant_name, 'El restaurante') || ' ha respondido a tu reseña',
      jsonb_build_object('restaurant_id', new.restaurant_id, 'review_id', new.review_id, 'restaurant', v_restaurant_name)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.remove_participant(p_participant_id uuid)
returns void as $$
declare
  v_participant public.table_participants;
  v_table       public.dining_tables;
begin
  select * into v_participant
  from public.table_participants
  where id = p_participant_id;

  if v_participant is null then
    raise exception 'Participant not found';
  end if;

  select * into v_table
  from public.dining_tables
  where id = v_participant.table_id;

  if v_table.host_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  delete from public.table_participants where id = p_participant_id;

  update public.dining_tables
  set available_seats = least(max_seats, available_seats + 1),
      status = case when status = 'full' then 'open' else status end
  where id = v_participant.table_id;

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    v_participant.user_id,
    'removed_from_table',
    'Plaza cancelada por el restaurante',
    'El restaurante ha cancelado tu plaza en ' || v_table.restaurant_name,
    jsonb_build_object('table_id', v_table.id, 'restaurant', v_table.restaurant_name)
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- 032: notify_demand_matches
-- ============================================================

create or replace function public.notify_demand_matches()
returns trigger as $$
declare
  v_match record;
  v_dow int;
begin
  if new.status <> 'open' or new.is_active is distinct from true then
    return new;
  end if;

  v_dow := extract(dow from new.date);

  for v_match in
    select * from public.demand_requests
    where status = 'active'
      and lower(city) = lower(new.restaurant_city)
      and (cuisine is null or new.cuisine_type is null or lower(cuisine) = lower(new.cuisine_type))
      and (date_pref is null or date_pref = new.date)
      and (day_of_week is null or day_of_week = v_dow)
      and (
        time_pref is null
        or (time_pref = 'midday' and new.time >= '12:00:00' and new.time < '17:00:00')
        or (time_pref = 'evening' and new.time >= '17:00:00')
      )
      and (language is null or new.languages is null or language = any(new.languages))
  loop
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_match.user_id,
      'table_match',
      'Hay una mesa que encaja contigo',
      new.restaurant_name || ' · ' || to_char(new.date, 'DD/MM') || ' · ' || new.restaurant_city,
      jsonb_build_object('table_id', new.id, 'demand_request_id', v_match.id, 'restaurant', new.restaurant_name, 'date', new.date, 'city', new.restaurant_city)
    );

    update public.demand_requests set status = 'matched' where id = v_match.id;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 034: notify_waitlist_on_seat_freed
-- ============================================================

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
      jsonb_build_object('table_id', new.id, 'restaurant', new.restaurant_name, 'date', new.date)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 037: notify_special_guest_proposed — metadata ya traía guest_name,
-- se renombra a 'name' para reusar el mismo esquema que el resto de tipos
-- ============================================================

create or replace function public.notify_special_guest_proposed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_special = true
     and (old.is_special is distinct from new.is_special or old.special_guest_name is distinct from new.special_guest_name)
     and auth.uid() is distinct from new.host_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.host_id,
      'special_guest_proposed',
      'Invitado especial propuesto',
      'Table4Singles ha propuesto un invitado especial para tu mesa' ||
        case when new.special_guest_name is not null then ': ' || new.special_guest_name else '' end,
      jsonb_build_object('table_id', new.id, 'name', new.special_guest_name)
    );
  end if;
  return new;
end;
$$;
