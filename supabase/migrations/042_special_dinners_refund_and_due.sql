-- Reglas del dueño (4 nov):
-- · Cena especial cancelada dentro de plazo: se devuelve el importe al comensal y no se debe nada al restaurante.
-- · Al restaurante se le debe su importe solo cuando la cena ya se ha celebrado (fecha pasada, hora de Madrid).
-- · Reserva normal (2 €): no reembolsable, sin solicitud de reembolso.

drop function if exists public.restaurant_special_earnings();
create function public.restaurant_special_earnings()
returns table(table_id uuid, table_date date, guest_name text, bookings bigint, upcoming_cents bigint, due_cents bigint, paid_cents bigint)
language sql security definer set search_path = public as $$
  select t.id, t.date, t.special_guest_name, count(*),
         coalesce(sum(p.restaurant_amount) filter (where p.payout_status = 'pending' and t.date >= (now() at time zone 'Europe/Madrid')::date), 0)::bigint,
         coalesce(sum(p.restaurant_amount) filter (where p.payout_status = 'pending' and t.date <  (now() at time zone 'Europe/Madrid')::date), 0)::bigint,
         coalesce(sum(p.restaurant_amount) filter (where p.payout_status = 'paid'), 0)::bigint
  from public.dining_tables t
  join public.reservation_payments p on p.table_id = t.id and p.status = 'paid' and p.restaurant_amount > 0
  where t.host_id = auth.uid() and p.payout_status in ('pending','paid')
  group by t.id, t.date, t.special_guest_name
  order by t.date desc nulls last
$$;
grant execute on function public.restaurant_special_earnings() to authenticated;

drop function if exists public.admin_restaurant_payouts();
create function public.admin_restaurant_payouts()
returns table(restaurant_id uuid, restaurant_name text, bookings bigint, upcoming_cents bigint, due_cents bigint, paid_cents bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.profiles where id = auth.uid()), false) then
    raise exception 'not authorized';
  end if;
  return query
    select t.host_id, max(coalesce(pr.restaurant_name, pr.display_name, t.restaurant_name)), count(*),
           coalesce(sum(p.restaurant_amount) filter (where p.payout_status = 'pending' and t.date >= (now() at time zone 'Europe/Madrid')::date), 0)::bigint,
           coalesce(sum(p.restaurant_amount) filter (where p.payout_status = 'pending' and t.date <  (now() at time zone 'Europe/Madrid')::date), 0)::bigint,
           coalesce(sum(p.restaurant_amount) filter (where p.payout_status = 'paid'), 0)::bigint
    from public.reservation_payments p
    join public.dining_tables t on t.id = p.table_id
    left join public.profiles pr on pr.id = t.host_id
    where p.status = 'paid' and p.restaurant_amount > 0 and p.payout_status in ('pending','paid')
    group by t.host_id
    order by 5 desc;
end $$;
grant execute on function public.admin_restaurant_payouts() to authenticated;

create or replace function public.admin_mark_restaurant_paid(p_restaurant uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if not coalesce((select is_admin from public.profiles where id = auth.uid()), false) then
    raise exception 'not authorized';
  end if;
  update public.reservation_payments p
     set payout_status = 'paid', paid_out_at = now()
   where p.payout_status = 'pending' and p.status = 'paid'
     and p.table_id in (select id from public.dining_tables
                         where host_id = p_restaurant and date < (now() at time zone 'Europe/Madrid')::date);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
grant execute on function public.admin_mark_restaurant_paid(uuid) to authenticated;

-- cancel_reservation: sin solicitud de reembolso (el reembolso de cenas especiales lo hace la función
-- cancel-reservation contra Stripe; las reservas normales de 2 € no se reembolsan).
create or replace function public.cancel_reservation(p_participant_id uuid)
returns void
language plpgsql security definer
as $function$
declare
  v_participant public.table_participants;
  v_date date;
begin
  select * into v_participant from public.table_participants where id = p_participant_id and user_id = auth.uid();
  if v_participant is null then raise exception 'Reservation not found'; end if;

  select date into v_date from public.dining_tables where id = v_participant.table_id;
  if v_date is not null and v_date < ((now() at time zone 'Europe/Madrid')::date + 1) then
    raise exception 'CANCEL_TOO_LATE';
  end if;

  delete from public.table_participants where id = p_participant_id;

  update public.dining_tables
  set available_seats = least(max_seats, available_seats + 1),
      status = case when status = 'full' then 'open' else status end
  where id = v_participant.table_id;

  update public.reservation_payments
     set payout_status = 'none'
   where table_id = v_participant.table_id and user_id = auth.uid() and payout_status = 'pending';
end;
$function$;
