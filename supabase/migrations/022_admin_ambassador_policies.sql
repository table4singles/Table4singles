-- Políticas RLS para panel de administrador y dashboard de embajadores
-- + funciones RPC para stats agregados

-- ── RLS: embajador ve los restaurantes que ha captado ─────────────────────────
create policy if not exists "Embajador ve restaurantes referidos"
  on public.profiles for select
  using (referred_by = auth.uid());

-- ── RLS: admin ve todo ────────────────────────────────────────────────────────
create policy if not exists "Admin ve todos los perfiles"
  on public.profiles for select
  using ((select is_admin from public.profiles where id = auth.uid() limit 1) = true);

create policy if not exists "Admin ve todas las mesas"
  on public.dining_tables for select
  using ((select is_admin from public.profiles where id = auth.uid() limit 1) = true);

create policy if not exists "Admin ve todos los participantes"
  on public.table_participants for select
  using ((select is_admin from public.profiles where id = auth.uid() limit 1) = true);

create policy if not exists "Admin ve todos los pagos"
  on public.reservation_payments for select
  using ((select is_admin from public.profiles where id = auth.uid() limit 1) = true);

create policy if not exists "Admin ve todos los embajadores"
  on public.ambassadors for select
  using ((select is_admin from public.profiles where id = auth.uid() limit 1) = true);

-- ── RPC: stats de restaurantes captados por un embajador ─────────────────────
create or replace function get_ambassador_restaurants(p_ambassador_id uuid)
returns table(
  restaurant_id      uuid,
  restaurant_name    text,
  subscription_status text,
  active_tables      bigint,
  total_reservations bigint,
  joined_at          timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.restaurant_name,
    p.subscription_status,
    count(distinct dt.id) filter (
      where dt.is_active = true and dt.status != 'cancelled'
    ) as active_tables,
    count(distinct tp.id) filter (
      where tp.status = 'approved'
    ) as total_reservations,
    p.created_at
  from profiles p
  left join dining_tables dt on dt.host_id = p.id
  left join table_participants tp on tp.table_id = dt.id
  where p.referred_by = p_ambassador_id
    and p.role = 'restaurant'
  group by p.id, p.restaurant_name, p.subscription_status, p.created_at
  order by p.created_at desc;
$$;

-- ── RPC: KPIs globales para el panel de admin ─────────────────────────────────
create or replace function get_admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  result     json;
begin
  select is_admin into v_is_admin from profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'No autorizado';
  end if;

  select json_build_object(
    'total_users',             (select count(*) from profiles where role = 'user'),
    'total_restaurants',       (select count(*) from profiles where role = 'restaurant'),
    'active_subscriptions',    (select count(*) from profiles where subscription_status = 'active'),
    'total_ambassadors',       (select count(*) from ambassadors where status = 'active'),
    'total_reservations',      (select count(*) from table_participants where status = 'approved'),
    'paid_reservations',       (select count(*) from reservation_payments where status = 'paid'),
    'reservation_revenue_cts', (select coalesce(sum(amount), 0) from reservation_payments where status = 'paid'),
    'mrr_cts',                 (select count(*) * 1000 from profiles where subscription_status = 'active')
  ) into result;

  return result;
end;
$$;

-- ── RPC: lista completa de restaurantes para admin ────────────────────────────
create or replace function get_admin_restaurants()
returns table(
  restaurant_id      uuid,
  restaurant_name    text,
  email              text,
  subscription_status text,
  active_tables      bigint,
  total_reservations bigint,
  ambassador_name    text,
  joined_at          timestamptz
)
language plpgsql
security definer
set search_path = public
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
  left join profiles ref on ref.id = p.referred_by
  where p.role = 'restaurant'
  group by p.id, p.restaurant_name, p.email, p.subscription_status, p.created_at, ref.display_name
  order by p.created_at desc;
end;
$$;

-- ── RPC: lista de embajadores con sus stats para admin ───────────────────────
create or replace function get_admin_ambassadors()
returns table(
  ambassador_user_id     uuid,
  display_name           text,
  email                  text,
  commission_rate        numeric,
  status                 text,
  restaurants_referred   bigint,
  active_subscriptions   bigint,
  monthly_commission_cts bigint,
  applied_at             timestamptz
)
language plpgsql
security definer
set search_path = public
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
    count(distinct r.id)                                                           as restaurants_referred,
    count(distinct r.id) filter (where r.subscription_status = 'active')          as active_subscriptions,
    (count(distinct r.id) filter (where r.subscription_status = 'active') * 1000 * a.commission_rate / 100)::bigint
                                                                                   as monthly_commission_cts,
    a.applied_at
  from ambassadors a
  join profiles p on p.id = a.user_id
  left join profiles r on r.referred_by = a.user_id and r.role = 'restaurant'
  group by a.user_id, p.display_name, p.email, a.commission_rate, a.status, a.applied_at
  order by a.applied_at desc;
end;
$$;
