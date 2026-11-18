-- Los recordatorios «tu cena es mañana» no salían nunca para las mesas sin hora (dt.date + dt.time es NULL).
-- Mesa con hora: igual que antes (23-25 h antes). Mesa sin hora: el día anterior, a partir de las 10:00 de Madrid.
create or replace function public.send_dinner_reminders()
returns void
language plpgsql security definer
as $function$
declare
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_hour_ok boolean := (now() at time zone 'Europe/Madrid')::time >= time '10:00';
begin
  -- Comensales (mesas con hora)
  insert into public.notifications (user_id, type, title, body, metadata)
  select tp.user_id, 'reminder_guest', 'Tu cena es mañana',
         'Recuerda tu cena en ' || dt.restaurant_name || ' el ' || to_char(dt.date, 'DD/MM') || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id, 'restaurant', dt.restaurant_name, 'date', dt.date, 'time', to_char(dt.time, 'HH24:MI'))
  from public.table_participants tp
  join public.dining_tables dt on dt.id = tp.table_id
  where dt.status in ('open', 'full') and dt.time is not null
    and not tp.reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  -- Comensales (mesas sin hora)
  insert into public.notifications (user_id, type, title, body, metadata)
  select tp.user_id, 'reminder_guest', 'Tu cena es mañana',
         'Recuerda tu cena en ' || dt.restaurant_name || ' el ' || to_char(dt.date, 'DD/MM'),
         jsonb_build_object('table_id', dt.id, 'restaurant', dt.restaurant_name, 'date', dt.date)
  from public.table_participants tp
  join public.dining_tables dt on dt.id = tp.table_id
  where dt.status in ('open', 'full') and dt.time is null
    and not tp.reminder_sent
    and v_hour_ok and dt.date = v_today + 1;

  update public.table_participants tp
  set reminder_sent = true
  from public.dining_tables dt
  where dt.id = tp.table_id
    and dt.status in ('open', 'full')
    and not tp.reminder_sent
    and (
      (dt.time is not null and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours'))
      or (dt.time is null and v_hour_ok and dt.date = v_today + 1)
    );

  -- Restaurante (mesas con hora)
  insert into public.notifications (user_id, type, title, body, metadata)
  select dt.host_id, 'reminder_host', 'Tu mesa es mañana',
         'Mañana recibes comensales en ' || dt.restaurant_name || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id, 'restaurant', dt.restaurant_name, 'time', to_char(dt.time, 'HH24:MI'))
  from public.dining_tables dt
  where dt.status in ('open', 'full') and dt.time is not null
    and not dt.host_reminder_sent
    and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours');

  -- Restaurante (mesas sin hora)
  insert into public.notifications (user_id, type, title, body, metadata)
  select dt.host_id, 'reminder_host', 'Tu mesa es mañana',
         'Mañana recibes comensales en ' || dt.restaurant_name,
         jsonb_build_object('table_id', dt.id, 'restaurant', dt.restaurant_name)
  from public.dining_tables dt
  where dt.status in ('open', 'full') and dt.time is null
    and not dt.host_reminder_sent
    and v_hour_ok and dt.date = v_today + 1
    and exists (select 1 from public.table_participants x where x.table_id = dt.id);

  update public.dining_tables dt
  set host_reminder_sent = true
  where dt.status in ('open', 'full')
    and not dt.host_reminder_sent
    and (
      (dt.time is not null and (dt.date + dt.time) between (now() + interval '23 hours') and (now() + interval '25 hours'))
      or (dt.time is null and v_hour_ok and dt.date = v_today + 1
          and exists (select 1 from public.table_participants x where x.table_id = dt.id))
    );
end;
$function$;
