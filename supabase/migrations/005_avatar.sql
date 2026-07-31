-- ============================================
-- 005: Foto de perfil de usuario
-- ============================================

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'Foto de perfil del usuario';
