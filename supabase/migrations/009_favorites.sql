-- ============================================
-- 009: Restaurantes favoritos
-- ============================================

create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  restaurant_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, restaurant_id)
);

comment on table public.favorites is 'Restaurantes marcados como favoritos por un usuario';

alter table public.favorites enable row level security;

create policy "Users can view own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "Users can add own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users can remove own favorites" on public.favorites for delete using (auth.uid() = user_id);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_restaurant_id_idx on public.favorites (restaurant_id);
