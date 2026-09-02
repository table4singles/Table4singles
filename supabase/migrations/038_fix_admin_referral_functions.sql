-- Bug real descubierto probando la pestaña "Especiales" del admin: las
-- pestañas Restaurantes y Embajadores del panel de admin llevaban rotas
-- (silenciosamente, sin banner de error — el frontend traga el error de la
-- RPC como array vacío) desde la migración 029, que cambió
-- profiles.referred_by de uuid a text (para poder guardar códigos de
-- embajador tipo "AMBX3F7K" en vez de un user id). get_admin_restaurants()
-- y get_admin_ambassadors() se quedaron comparando referred_by (ahora text)
-- directamente contra profiles.id / ambassadors.user_id (uuid) —
-- "operator does not exist: uuid = text". El camino correcto pasa por
-- ambassadors.referral_code (text), no por el user_id/profiles.id.

create or replace function public.get_admin_restaurants()
returns table(restaurant_id uuid, restaurant_name text, email text, subscription_status text, active_tables bigint, total_reservations bigint, ambassador_name text, joined_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_is_admin boolean;
begin
  select is_admin into v_is_admin from profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    p.id,
    p.restaurant_name,
    p.email,
    p.subscription_status,
    count(distinct dt.id) filter (
      where dt.is_active = true and dt.status != 'cancelled'
    ) as active_tables,
    count(distinct tp.id) filter (
      where tp.status = 'approved'
    ) as total_reservations,
    ref.display_name as ambassador_name,
    p.created_at
  from profiles p
  left join dining_tables dt on dt.host_id = p.id
  left join table_participants tp on tp.table_id = dt.id
  left join ambassadors amb on amb.referral_code = p.referred_by
  left join profiles ref on ref.id = amb.user_id
  where p.role = 'restaurant'
  group by p.id, p.restaurant_name, p.email, p.subscription_status, p.created_at, ref.display_name
  order by p.created_at desc;
end;
$$;

create or replace function public.get_admin_ambassadors()
returns table(ambassador_user_id uuid, display_name text, email text, commission_rate numeric, status text, restaurants_referred bigint, active_subscriptions bigint, monthly_commission_cts bigint, applied_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_is_admin boolean;
begin
  select is_admin into v_is_admin from profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    a.user_id,
    p.display_name,
    p.email,
    a.commission_rate,
    a.status,
    count(distinct r.id) as restaurants_referred,
    count(distinct r.id) filter (where r.subscription_status = 'active') as active_subscriptions,
    (count(distinct r.id) filter (where r.subscription_status = 'active') * 1000 * a.commission_rate / 100)::bigint as monthly_commission_cts,
    a.applied_at
  from ambassadors a
  join profiles p on p.id = a.user_id
  left join profiles r on r.referred_by = a.referral_code and r.role = 'restaurant'
  group by a.user_id, p.display_name, p.email, a.commission_rate, a.status, a.applied_at
  order by a.applied_at desc;
end;
$$;
