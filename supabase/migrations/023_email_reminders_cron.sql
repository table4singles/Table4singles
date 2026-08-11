-- ============================================================
-- Recordatorios de reserva por email (pg_cron + pg_net)
-- REQUISITOS previos en Supabase Dashboard > Database > Extensions:
--   · pg_cron  → debe estar habilitado
--   · pg_net   → debe estar habilitado
-- ============================================================

-- Habilitar pg_net para llamadas HTTP asíncronas
create extension if not exists pg_net with schema extensions;

-- Función que invoca la Edge Function send-reservation-reminders
create or replace function public.trigger_reservation_reminders()
returns void
language plpgsql
security definer
as $$
declare
  _url text := 'https://jcuonaxmworztegolvyv.supabase.co/functions/v1/send-reservation-reminders';
  _key text;
begin
  -- El service role key se guarda como secret de Supabase
  begin
    _key := current_setting('app.settings.service_role_key');
  exception when others then
    _key := '';
  end;

  perform extensions.http_post(
    _url,
    '{}',
    'application/json',
    ARRAY[
      ('Authorization', 'Bearer ' || _key)::extensions.http_header
    ]
  );
exception when others then
  -- Silenciar errores para que el cron no falle
  null;
end;
$$;

-- Cron job: cada día a las 18:00 UTC (20:00 hora España en verano)
-- Eliminar si ya existe para poder recrearlo limpiamente
select cron.unschedule('send-reservation-reminders-daily')
  from cron.job
  where jobname = 'send-reservation-reminders-daily';

select cron.schedule(
  'send-reservation-reminders-daily',
  '0 18 * * *',
  'select public.trigger_reservation_reminders()'
);
