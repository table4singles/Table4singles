-- Extra fields for restaurant profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS restaurant_hours        text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS restaurant_total_tables integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS restaurant_menu_url     text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS restaurant_offers       text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS restaurant_specialties  text[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS restaurant_address      text    DEFAULT NULL;
