-- 1) Cerrar un agujero: los comensales podían borrar o modificar su participación directamente por la API,
--    saltándose el plazo de cancelación y dejando plazas y cobros a restaurantes sin actualizar.
--    La app nunca lo hace así (usa join_table / cancel_reservation / cancel-reservation).
drop policy if exists "Users can delete own participation" on public.table_participants;
drop policy if exists "Users can update own participation" on public.table_participants;

-- 2) Si el restaurante quita a un comensal, no es culpa del comensal: no se le debe nada al restaurante por esa plaza
--    (la función remove-participant devuelve el dinero en Stripe; si falla, queda solicitud de reembolso).
create or replace function public.remove_participant(p_participant_id uuid)
returns void
language plpgsql security definer
as $function$
declare
  v_participant public.table_participants;
  v_table       public.dining_tables;
begin
  select * into v_participant from public.table_participants where id = p_participant_id;
  if v_participant is null then raise exception 'Participant not found'; end if;

  select * into v_table from public.dining_tables where id = v_participant.table_id;
  if v_table.host_id <> auth.uid() then raise exception 'Not authorized'; end if;

  delete from public.table_participants where id = p_participant_id;

  update public.dining_tables
  set available_seats = least(max_seats, available_seats + 1),
      status = case when status = 'full' then 'open' else status end
  where id = v_participant.table_id;

  update public.reservation_payments
     set payout_status = 'none'
   where table_id = v_participant.table_id and user_id = v_participant.user_id and payout_status = 'pending';

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    v_participant.user_id,
    'removed_from_table',
    'Plaza cancelada por el restaurante',
    'El restaurante ha cancelado tu plaza en ' || v_table.restaurant_name,
    jsonb_build_object('table_id', v_table.id, 'restaurant', v_table.restaurant_name)
  );
end;
$function$;
