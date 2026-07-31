-- ============================================
-- 008: Sistema de referidos (enlace directo, sin codigos)
-- ============================================
-- Un usuario comparte un enlace tipo https://.../?ref={su_id}. Si alguien
-- se registra a traves de ese enlace, guardamos quien le invito.

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

comment on column public.profiles.referred_by is 'ID del usuario que invito a este usuario (sistema de referidos)';

create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referred_by uuid;
begin
  begin
    v_referred_by := nullif(new.raw_user_meta_data->>'referred_by', '')::uuid;
  exception when others then
    v_referred_by := null;
  end;

  -- Un usuario no puede referirse a si mismo y el referente debe existir
  if v_referred_by is not null and (
    v_referred_by = new.id or not exists (select 1 from public.profiles where id = v_referred_by)
  ) then
    v_referred_by := null;
  end if;

  insert into public.profiles (id, display_name, role, email, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.email,
    v_referred_by
  );
  return new;
end;
$$ language plpgsql security definer;
