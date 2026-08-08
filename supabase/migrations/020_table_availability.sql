-- Nuevo modelo de mesas: disponibilidad continua con toggle activo/inactivo
-- La hora deja de ser obligatoria (las mesas ya no son eventos puntuales)
-- Se añade is_active para que el restaurante active/desactive la mesa cuando quiera
-- Se añade available_until como fecha opcional de fin de disponibilidad

alter table public.dining_tables alter column time drop not null;
alter table public.dining_tables alter column time set default null;

alter table public.dining_tables
  add column if not exists is_active boolean not null default true,
  add column if not exists available_until date;

-- Las mesas existentes se marcan como activas
update public.dining_tables set is_active = true where is_active is null;
