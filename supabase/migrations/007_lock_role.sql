-- ============================================
-- 007: Bloquear cambio de rol (usuario <-> restaurante)
-- ============================================
-- Usuario y restaurante son dos tipos de cuenta distintos (dashboards,
-- navegacion y flujos diferentes). El rol se elige al registrarse y no
-- debe poder cambiarse despues, ni siquiera manipulando la API directamente.

create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if NEW.role is distinct from OLD.role then
    raise exception 'No se puede cambiar el rol de una cuenta despues de crearla';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_role_change on public.profiles;

create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_change();

comment on function public.prevent_role_change() is 'Impide cambiar profiles.role tras la creacion de la cuenta (usuario vs restaurante son cuentas distintas)';
