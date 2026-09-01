-- Bug descubierto el 2026-09-01 probando el flujo de escaneo de QR: la sección de
-- reseñas de RestaurantProfilePage falla en silencio con PGRST200 ("Could not find
-- a relationship between 'restaurant_reviews' and 'profiles'"). Causa: las FKs de
-- restaurant_reviews apuntan a auth.users en vez de public.profiles (a diferencia
-- del resto de tablas nuevas, ej. demand_requests), así que PostgREST no puede
-- resolver el embed `profiles(...)` que usa useRestaurantPublicReviews.

alter table public.restaurant_reviews
  drop constraint if exists restaurant_reviews_user_id_fkey,
  add constraint restaurant_reviews_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.restaurant_reviews
  drop constraint if exists restaurant_reviews_restaurant_id_fkey,
  add constraint restaurant_reviews_restaurant_id_fkey
    foreign key (restaurant_id) references public.profiles(id) on delete cascade;

alter table public.restaurant_review_replies
  drop constraint if exists restaurant_review_replies_restaurant_id_fkey,
  add constraint restaurant_review_replies_restaurant_id_fkey
    foreign key (restaurant_id) references public.profiles(id) on delete cascade;
