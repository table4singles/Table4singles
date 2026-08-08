-- ============================================================
-- TABLE4SINGLES — SETUP COMPLETO DE BASE DE DATOS
-- Pega este script completo en el SQL Editor de Supabase y ejecuta.
-- IMPORTANTE: Antes de ejecutar, activa la extensión pg_cron en
-- Database > Extensions (busca "pg_cron" y actívala).
-- ============================================================


-- ============================================================
-- SCHEMA BASE
-- ============================================================

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  bio text,
  city text,
  country text,
  languages text[] default '{}',
  interests text[] default '{}',
  role text not null default 'user' check (role in ('user', 'restaurant')),
  is_admin boolean default false,
  word_penalised boolean default false,
  restaurant_name text,
  restaurant_cuisine text,
  restaurant_description text,
  restaurant_website text,
  restaurant_phone text,
  restaurant_price_range text default '$$',
  restaurant_photos text[] default '{}',
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.cities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  active boolean default true
);

create table public.dining_tables (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.profiles(id) on delete cascade not null,
  restaurant_name text not null,
  restaurant_address text,
  restaurant_city text not null,
  restaurant_country text not null default '',
  restaurant_image_url text,
  date date not null,
  time time not null,
  max_seats integer not null default 6,
  available_seats integer not null default 5,
  status text not null default 'open' check (status in ('open', 'full', 'completed', 'cancelled')),
  description text,
  cuisine_type text,
  languages text[],
  deposit_amount numeric(10,2) default 7.00,
  created_at timestamptz default now()
);

create table public.table_participants (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  join_type text not null default 'word' check (join_type in ('word', 'deposit')),
  deposit_paid boolean default false,
  created_at timestamptz default now(),
  unique(table_id, user_id)
);

create table public.invitations (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  invitee_id uuid references public.profiles(id) on delete cascade not null,
  payment_covered boolean default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  ambiance_rating integer check (ambiance_rating >= 1 and ambiance_rating <= 5),
  food_rating integer check (food_rating >= 1 and food_rating <= 5),
  company_rating integer check (company_rating >= 1 and company_rating <= 5),
  created_at timestamptz default now(),
  unique(table_id, reviewer_id)
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null default '',
  metadata jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create table public.refund_claims (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references public.dining_tables(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  stripe_session_id text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table public.vip_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text unique not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade,
  code text unique not null,
  used boolean default false,
  created_at timestamptz default now()
);

create table public.restaurant_terms_acceptance (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.profiles(id) on delete cascade not null,
  accepted_at timestamptz default now(),
  ip_address text
);

-- RLS
alter table public.profiles enable row level security;
alter table public.dining_tables enable row level security;
alter table public.table_participants enable row level security;
alter table public.invitations enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.refund_claims enable row level security;
alter table public.cities enable row level security;
alter table public.payments enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Tables are viewable by everyone" on public.dining_tables for select using (true);
create policy "Authenticated users can create tables" on public.dining_tables for insert with check (auth.uid() = host_id);
create policy "Hosts can update their tables" on public.dining_tables for update using (auth.uid() = host_id);
create policy "Participants are viewable by everyone" on public.table_participants for select using (true);
create policy "Authenticated users can join tables" on public.table_participants for insert with check (auth.uid() = user_id);
create policy "Users can update own participation" on public.table_participants for update using (auth.uid() = user_id);
create policy "Users can delete own participation" on public.table_participants for delete using (auth.uid() = user_id);
create policy "Users can view their invitations" on public.invitations for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);
create policy "Users can create invitations" on public.invitations for insert with check (auth.uid() = inviter_id);
create policy "Invitees can update invitations" on public.invitations for update using (auth.uid() = invitee_id);
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Authenticated users can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);
create policy "Messages are viewable by everyone" on public.messages for select using (true);
create policy "Authenticated users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Users can view own refund claims" on public.refund_claims for select using (auth.uid() = user_id);
create policy "Users can create refund claims" on public.refund_claims for insert with check (auth.uid() = user_id);
create policy "Cities are viewable by everyone" on public.cities for select using (true);
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);

-- Storage
insert into storage.buckets (id, name, public) values ('restaurant-photos', 'restaurant-photos', true);
create policy "Anyone can view restaurant photos" on storage.objects for select using (bucket_id = 'restaurant-photos');
create policy "Authenticated users can upload restaurant photos" on storage.objects for insert with check (bucket_id = 'restaurant-photos' and auth.role() = 'authenticated');
create policy "Users can delete own restaurant photos" on storage.objects for delete using (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime base
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.table_participants;
alter publication supabase_realtime add table public.dining_tables;

