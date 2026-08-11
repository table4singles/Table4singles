-- Fix: infinite recursion in profiles RLS
-- Cause: policy "Admin ve todos los perfiles" did
--   SELECT is_admin FROM profiles ...
-- inside a SELECT policy on profiles itself.
--
-- Fix: SECURITY DEFINER helper that bypasses RLS,
-- drop the redundant recursive profiles policy,
-- and point other admin policies at the helper.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid() limit 1),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Redundant: "Profiles are viewable by everyone" already allows SELECT for all
drop policy if exists "Admin ve todos los perfiles" on public.profiles;

drop policy if exists "Admin ve todas las mesas" on public.dining_tables;
create policy "Admin ve todas las mesas"
  on public.dining_tables for select
  using (public.is_admin());

drop policy if exists "Admin ve todos los participantes" on public.table_participants;
create policy "Admin ve todos los participantes"
  on public.table_participants for select
  using (public.is_admin());

drop policy if exists "Admin ve todos los pagos" on public.reservation_payments;
create policy "Admin ve todos los pagos"
  on public.reservation_payments for select
  using (public.is_admin());

drop policy if exists "Admin ve todos los embajadores" on public.ambassadors;
create policy "Admin ve todos los embajadores"
  on public.ambassadors for select
  using (public.is_admin());
