-- ============================================
-- 004: Preferencias de ajustes de usuario
-- ============================================

alter table public.profiles
  add column if not exists email_notifications boolean default true,
  add column if not exists push_notifications boolean default true,
  add column if not exists theme_preference text default 'light' check (theme_preference in ('light', 'dark'));

comment on column public.profiles.email_notifications is 'Recibir notificaciones por email';
comment on column public.profiles.push_notifications is 'Recibir notificaciones push/en la app';
comment on column public.profiles.theme_preference is 'Preferencia de tema visual: light u dark';
