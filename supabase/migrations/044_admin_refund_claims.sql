-- Pantalla de admin para las solicitudes de reembolso pendientes (reembolsos automáticos que fallaron).
create or replace function public.admin_refund_claims()
returns table(id uuid, created_at timestamptz, status text, reason text, diner_name text,
              restaurant_name text, table_date date, amount_cents integer, payment_status text)
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select pa.is_admin from public.profiles pa where pa.id = auth.uid()), false) then
    raise exception 'not authorized';
  end if;
  return query
    select c.id, c.created_at, coalesce(c.status, 'pending'), c.reason,
           coalesce(pr.full_name, pr.display_name, 'Comensal'),
           t.restaurant_name, t.date,
           p.amount, p.status
      from public.refund_claims c
      left join public.profiles pr on pr.id = c.user_id
      left join public.dining_tables t on t.id = c.table_id
      left join lateral (
        select rp.amount, rp.status from public.reservation_payments rp
         where rp.table_id = c.table_id and rp.user_id = c.user_id and rp.status in ('paid','refunded')
         order by rp.created_at desc limit 1
      ) p on true
     order by (coalesce(c.status, 'pending') = 'pending') desc, c.created_at desc;
end $$;
grant execute on function public.admin_refund_claims() to authenticated;

create or replace function public.admin_resolve_refund_claim(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_admin from public.profiles where id = auth.uid()), false) then
    raise exception 'not authorized';
  end if;
  update public.refund_claims set status = 'resolved' where id = p_id;
end $$;
grant execute on function public.admin_resolve_refund_claim(uuid) to authenticated;
