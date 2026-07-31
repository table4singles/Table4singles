-- ============================================
-- 003: Campos de onboarding en profiles
-- ============================================

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists street_address text,
  add column if not exists province text,
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists instagram text,
  add column if not exists onboarding_completed boolean default false;

comment on column public.profiles.full_name is 'Nombre completo del usuario';
comment on column public.profiles.street_address is 'Calle y número';
comment on column public.profiles.province is 'Provincia/Estado';
comment on column public.profiles.date_of_birth is 'Fecha de nacimiento';
comment on column public.profiles.phone is 'Teléfono de contacto';
comment on column public.profiles.instagram is 'Usuario de Instagram (opcional)';
comment on column public.profiles.onboarding_completed is 'Si el usuario completó el onboarding inicial';
