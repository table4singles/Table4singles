-- Migración 018 — Table4Singles
-- Habilitar Realtime en la tabla notifications para que el panel
-- de notificaciones del usuario se actualice en tiempo real sin recargar.
-- Ejecutar en SQL Editor del proyecto zocrwanhcschmydczgeh

alter publication supabase_realtime add table public.notifications;
