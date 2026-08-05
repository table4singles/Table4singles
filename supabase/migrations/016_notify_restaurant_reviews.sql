-- Notify restaurant when a user leaves (or updates) a venue review.
-- Run in Supabase SQL Editor of project zocrwanhcschmydczgeh.

create or replace function public.notify_new_restaurant_review()
returns trigger as $$
declare
  reviewer_name text;
begin
  select coalesce(nullif(trim(display_name), ''), 'Un usuario')
    into reviewer_name
  from public.profiles
  where id = new.user_id;

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.restaurant_id,
    'new_restaurant_review',
    'Nueva reseña',
    reviewer_name || ' te ha valorado con ' || new.rating || ' estrellas',
    jsonb_build_object(
      'restaurant_id', new.restaurant_id,
      'review_id', new.id,
      'rating', new.rating
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_restaurant_review_created on public.restaurant_reviews;
create trigger on_restaurant_review_created
  after insert on public.restaurant_reviews
  for each row execute procedure public.notify_new_restaurant_review();

create or replace function public.notify_updated_restaurant_review()
returns trigger as $$
declare
  reviewer_name text;
begin
  if old.rating is not distinct from new.rating
     and old.comment is not distinct from new.comment then
    return new;
  end if;

  select coalesce(nullif(trim(display_name), ''), 'Un usuario')
    into reviewer_name
  from public.profiles
  where id = new.user_id;

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.restaurant_id,
    'updated_restaurant_review',
    'Reseña actualizada',
    reviewer_name || ' ha actualizado su valoración a ' || new.rating || ' estrellas',
    jsonb_build_object(
      'restaurant_id', new.restaurant_id,
      'review_id', new.id,
      'rating', new.rating
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_restaurant_review_updated on public.restaurant_reviews;
create trigger on_restaurant_review_updated
  after update on public.restaurant_reviews
  for each row execute procedure public.notify_updated_restaurant_review();
