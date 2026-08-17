-- Privacidad de comensales: ciudad y edad visibles solo si el usuario lo activa.
-- La dirección (street_address) nunca se expone en listados públicos (no se selecciona en el cliente).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_city boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_age boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.show_city IS 'Si true, ciudad/provincia/país se muestran en el perfil público del comensal';
COMMENT ON COLUMN public.profiles.show_age IS 'Si true, la edad (derivada de date_of_birth) se muestra en el perfil público';
