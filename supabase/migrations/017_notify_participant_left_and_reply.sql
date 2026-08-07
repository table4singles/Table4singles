-- Migración 017 — Table4Singles
-- 1. Notificar al restaurante cuando un participante cancela su reserva
-- 2. Notificar al usuario cuando el restaurante responde a su reseña
-- 3. RPC remove_participant: el restaurante puede eliminar un comensal de su mesa
-- Ejecutar en SQL Editor del proyecto zocrwanhcschmydczgeh

-- ============================================================
-- 1. notify_participant_left: trigger AFTER DELETE en table_participants
-- ============================================================
create or replace function public.notify_participant_left()
returns trigger as $$
declare
  v_table  public.dining_tables;
  v_name   text;
begin
  select * into v_table from public.dining_tables where id = old.table_id;
  select coalesce(display_name, 'Un comensal')
    into v_name
  from public.profiles
  where id = old.user_id;

  -- Solo notificamos si hay un host distinto al propio participante
  if v_table.host_id is not null and v_table.host_id <> old.user_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_table.host_id,
      'participant_left',
      'Un comensal ha cancelado',
      v_name || ' ha cancelado su plaza en ' || v_table.restaurant_name,
      jsonb_build_object('table_id', v_table.id)
    );
  end if;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_table_participant_deleted on public.table_participants;
create trigger on_table_participant_deleted
  after delete on public.table_participants
  for each row execute procedure public.notify_participant_left();

-- ============================================================
-- 2. notify_review_reply: trigger AFTER INSERT/UPDATE en restaurant_review_replies
-- ============================================================
create or replace function public.notify_review_reply()
returns trigger as $$
declare
  v_restaurant_name  text;
  v_reviewer_user_id uuid;
begin
  -- Recuperar el user_id del autor de la reseña
  select user_id
    into v_reviewer_user_id
  from public.restaurant_reviews
  where id = new.review_id;

  -- Nombre del restaurante
  select coalesce(restaurant_name, 'El restaurante')
    into v_restaurant_name
  from public.profiles
  where id = new.restaurant_id;

  -- No notificar si el restaurante se está respondiendo a sí mismo
  if v_reviewer_user_id is not null and v_reviewer_user_id <> new.restaurant_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_reviewer_user_id,
      'review_reply',
      'Respuesta a tu reseña',
      v_restaurant_name || ' ha respondido a tu reseña',
      jsonb_build_object(
        'restaurant_id', new.restaurant_id,
        'review_id', new.review_id
      )
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_reply_created on public.restaurant_review_replies;
create trigger on_review_reply_created
  after insert on public.restaurant_review_replies
  for each row execute procedure public.notify_review_reply();

-- También disparar al editar la respuesta
drop trigger if exists on_review_reply_updated on public.restaurant_review_replies;
create trigger on_review_reply_updated
  after update on public.restaurant_review_replies
  for each row
  when (old.reply is distinct from new.reply)
  execute procedure public.notify_review_reply();

-- ============================================================
-- 3. remove_participant: el restaurante puede eliminar un comensal
-- ============================================================
create or replace function public.remove_participant(p_participant_id uuid)
returns void as $$
declare
  v_participant public.table_participants;
  v_table       public.dining_tables;
  v_name        text;
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

  -- Solo el host de la mesa puede eliminar participantes
  if v_table.host_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  select coalesce(display_name, 'Alguien')
    into v_name
  from public.profiles
  where id = v_participant.user_id;

  -- Eliminar participante y liberar plaza
  delete from public.table_participants where id = p_participant_id;

  update public.dining_tables
  set available_seats = least(max_seats, available_seats + 1),
      status = case when status = 'full' then 'open' else status end
  where id = v_participant.table_id;

  -- Notificar al comensal eliminado
  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    v_participant.user_id,
    'removed_from_table',
    'Plaza cancelada por el restaurante',
    'El restaurante ha cancelado tu plaza en ' || v_table.restaurant_name,
    jsonb_build_object('table_id', v_table.id)
  );
end;
$$ language plpgsql security definer;
