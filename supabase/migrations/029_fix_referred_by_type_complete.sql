-- Migración 029: Fix definitivo de profiles.referred_by (UUID → TEXT)
--
-- Problema: la columna referred_by era de tipo UUID, pero almacena códigos de
-- embajador en formato texto (ej. "AMBX3F7K"). Esto bloqueaba el registro de
-- cualquier usuario con un error "column referred_by is of type uuid but
-- expression is of type text".
--
-- Fix:
--   1. Eliminar FK constraint obsoleta (referred_by → profiles.id)
--   2. Eliminar política RLS que usaba la comparación UUID antigua
--   3. Cambiar el tipo de columna a text
--   4. Recrear la política RLS con la comparación correcta (referral_code)

-- 1. Eliminar FK constraint antigua
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;

-- 2. Eliminar política RLS obsoleta
DROP POLICY IF EXISTS "Embajador ve restaurantes referidos" ON public.profiles;

-- 3. Cambiar referred_by de uuid a text
ALTER TABLE public.profiles ALTER COLUMN referred_by TYPE text USING referred_by::text;

-- 4. Recrear política RLS correcta: embajador ve perfiles cuyo referred_by
--    coincide con su referral_code (texto)
CREATE POLICY "Embajador ve restaurantes referidos" ON public.profiles
  FOR SELECT
  USING (
    referred_by = (
      SELECT referral_code FROM public.ambassadors WHERE user_id = auth.uid()
    )
  );
