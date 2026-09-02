-- Cenas Especiales / Special Guests: una mesa puede marcarse con un invitado
-- destacado (nombre + bio + foto). La puede crear el propio restaurante (ya
-- puede editar sus mesas) o el admin en nombre de cualquier restaurante — en
-- ese segundo caso se avisa al restaurante por notificación, sin bloquear la
-- mesa hasta que la acepte (decisión del usuario: ambos pueden crearla
-- directamente, "proponer" es solo el aviso, no una aprobación).

alter table public.dining_tables
  add column if not exists is_special boolean not null default false,
  add column if not exists special_guest_name text,
  add column if not exists special_guest_bio text,
  add column if not exists special_guest_photo_url text;

-- El admin no podía actualizar mesas ajenas (solo SELECT) — lo necesita para
-- poder proponer un invitado especial en una mesa de cualquier restaurante.
create policy "Admin puede actualizar cualquier mesa"
  on public.dining_tables for update
  using (is_admin());

create or replace function public.notify_special_guest_proposed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_special = true
     and (old.is_special is distinct from new.is_special or old.special_guest_name is distinct from new.special_guest_name)
     and auth.uid() is distinct from new.host_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.host_id,
      'special_guest_proposed',
      'Invitado especial propuesto',
      'Table4Singles ha propuesto un invitado especial para tu mesa' ||
        case when new.special_guest_name is not null then ': ' || new.special_guest_name else '' end,
      jsonb_build_object('table_id', new.id, 'guest_name', new.special_guest_name)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_special_guest_proposed
  after update on public.dining_tables
  for each row
  execute function public.notify_special_guest_proposed();
