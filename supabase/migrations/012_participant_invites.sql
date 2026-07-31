-- ============================================
-- 012: Permitir que los participantes (no solo el anfitrión) inviten
-- ============================================
-- Hasta ahora solo el anfitrión (host_id) podia crear invitaciones para
-- una mesa. Como las mesas las crea siempre el restaurante, esto impedia
-- que un usuario normal con una reserva ya confirmada pudiera invitar a
-- otro comensal a su misma mesa (p.ej. desde la pestaña "Comensales").
-- Ahora tambien puede invitar cualquier participante con status = 'approved'
-- en esa mesa. La comprobacion de plazas libres sigue ocurriendo de forma
-- atomica al aceptar la invitacion (funcion join_table), no aqui.

drop policy if exists "Hosts can create invitations for their tables" on public.invitations;

create policy "Hosts and participants can create invitations for their tables" on public.invitations
  for insert with check (
    auth.uid() = inviter_id
    and (
      exists (select 1 from public.dining_tables dt where dt.id = table_id and dt.host_id = auth.uid())
      or exists (
        select 1 from public.table_participants tp
        where tp.table_id = invitations.table_id and tp.user_id = auth.uid() and tp.status = 'approved'
      )
    )
  );
