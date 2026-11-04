-- Si se cancela una mesa (culpa del restaurante, no del comensal) hay que devolver TODO lo cobrado.
-- La función cancel-table devuelve el dinero en Stripe antes de cancelar. Este trigger es la red de seguridad:
-- por cada pago que siga como 'paid' al cancelarse la mesa (reembolso fallido, o cancelación directa sin pasar
-- por la función) deja una solicitud de reembolso pendiente y anula lo que se le debía al restaurante.
create or replace function public.tg_table_cancelled_refunds()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    insert into public.refund_claims (table_id, user_id, reason, status)
    select p.table_id, p.user_id, 'Mesa cancelada por el restaurante: devolver el pago completo', 'pending'
      from public.reservation_payments p
     where p.table_id = new.id and p.status = 'paid';

    update public.reservation_payments
       set payout_status = 'none'
     where table_id = new.id and payout_status = 'pending';
  end if;
  return new;
end $$;

drop trigger if exists table_cancelled_refunds on public.dining_tables;
create trigger table_cancelled_refunds
  after update of status on public.dining_tables
  for each row execute function public.tg_table_cancelled_refunds();
