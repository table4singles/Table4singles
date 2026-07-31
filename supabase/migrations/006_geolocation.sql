-- ============================================
-- 006: Geolocalización en profiles (busqueda por radio km)
-- ============================================

alter table public.profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.profiles.latitude is 'Latitud geocodificada (a partir de city/country) para busqueda por radio';
comment on column public.profiles.longitude is 'Longitud geocodificada (a partir de city/country) para busqueda por radio';

create index if not exists profiles_lat_lng_idx on public.profiles (latitude, longitude);
