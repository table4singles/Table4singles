-- Cuando se publica una mesa nueva, busca peticiones de "Avísame" (demand_requests)
-- activas que encajen (ciudad + cocina + fecha/día + franja horaria + idioma, todos
-- opcionales salvo ciudad) y notifica a esos usuarios. Comparación directa de campos,
-- sin IA/ML — igual que el resto de triggers de notificaciones del proyecto.

create or replace function public.notify_demand_matches()
returns trigger as $$
declare
  v_match record;
  v_dow int;
begin
  if new.status <> 'open' or new.is_active is distinct from true then
    return new;
  end if;

  v_dow := extract(dow from new.date);

  for v_match in
    select * from public.demand_requests
    where status = 'active'
      and lower(city) = lower(new.restaurant_city)
      and (cuisine is null or new.cuisine_type is null or lower(cuisine) = lower(new.cuisine_type))
      and (date_pref is null or date_pref = new.date)
      and (day_of_week is null or day_of_week = v_dow)
      and (
        time_pref is null
        or (time_pref = 'midday' and new.time >= '12:00:00' and new.time < '17:00:00')
        or (time_pref = 'evening' and new.time >= '17:00:00')
      )
      and (language is null or new.languages is null or language = any(new.languages))
  loop
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_match.user_id,
      'table_match',
      'Hay una mesa que encaja contigo',
      new.restaurant_name || ' · ' || to_char(new.date, 'DD/MM') || ' · ' || new.restaurant_city,
      jsonb_build_object('table_id', new.id, 'demand_request_id', v_match.id)
    );

    update public.demand_requests set status = 'matched' where id = v_match.id;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_dining_table_created_match_demand on public.dining_tables;
create trigger on_dining_table_created_match_demand
  after insert on public.dining_tables
  for each row execute procedure public.notify_demand_matches();
