-- ============================================
-- 011: Recordatorios automaticos 24h antes de la cena (solo in-app)
-- ============================================
-- Nota: si "create extension pg_cron" falla por permisos, hay que activar
-- la extension "pg_cron" primero desde Database > Extensions en el
-- dashboard de Supabase, y volver a ejecutar este script.

create extension if not exists pg_cron;

alter table public.table_participants add column if not exists reminder_sent boolean default false;
alter table public.dining_tables add column if not exists host_reminder_sent boolean default false;

create or replace function public.send_dinner_reminders()
returns void
language plpgsql
security definer
as $$
begin
  -- Recordatorio para comensales confirmados
  insert into public.notifications (user_id, type, title, body, metadata)
  select tp.user_id, 'reminder', 'Tu cena es mañana',
         'Recuerda tu cena en ' || dt.restaurant_name || ' el ' || to_char(dt.date, 'DD/MM') || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id)
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

  -- Recordatorio para el anfitrion
  insert into public.notifications (user_id, type, title, body, metadata)
  select dt.host_id, 'reminder', 'Tu mesa es mañana',
         'Mañana recibes comensales en ' || dt.restaurant_name || ' a las ' || to_char(dt.time, 'HH24:MI'),
         jsonb_build_object('table_id', dt.id)
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

do $$
begin
  perform cron.unschedule('send_dinner_reminders_hourly');
exception when others then
  null;
end $$;

select cron.schedule(
  'send_dinner_reminders_hourly',
  '0 * * * *',
  $$select public.send_dinner_reminders();$$
);
