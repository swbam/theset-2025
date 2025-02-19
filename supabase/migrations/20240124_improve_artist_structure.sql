-- Create new artist_identifiers table
create table if not exists public.artist_identifiers (
    id uuid default gen_random_uuid() primary key,
    artist_id uuid not null,
    platform text not null check (platform in ('spotify', 'ticketmaster')),
    platform_id text not null,
    last_synced_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    
    constraint artist_identifiers_platform_id_unique unique (platform, platform_id)
);

-- Add index for common lookups
create index if not exists idx_artist_identifiers_artist_platform 
on public.artist_identifiers (artist_id, platform);

-- Add foreign key constraint
alter table public.artist_identifiers
add constraint fk_artist_identifiers_artist
foreign key (artist_id)
references public.artists (id)
on delete cascade;

-- Backup existing artists data
create table if not exists public.artists_backup as
select * from public.artists;

-- Migrate existing Spotify IDs to artist_identifiers
insert into public.artist_identifiers (artist_id, platform, platform_id, last_synced_at)
select 
    id as artist_id,
    'spotify' as platform,
    spotify_id as platform_id,
    last_synced_at
from public.artists
where spotify_id is not null;

-- Migrate existing Ticketmaster IDs to artist_identifiers
insert into public.artist_identifiers (artist_id, platform, platform_id, last_synced_at)
select 
    id as artist_id,
    'ticketmaster' as platform,
    ticketmaster_id as platform_id,
    last_synced_at
from public.artists
where ticketmaster_id is not null;

-- Create temporary columns for new structure
alter table public.artists
add column if not exists metadata jsonb;

-- Update metadata column with existing data
update public.artists
set metadata = jsonb_build_object(
    'genres', genres,
    'popularity', popularity,
    'spotify_data', spotify_data,
    'ticketmaster_data', ticketmaster_data
)
where genres is not null 
   or popularity is not null 
   or spotify_data is not null 
   or ticketmaster_data is not null;

-- Remove old columns from artists table
alter table public.artists
drop column if exists spotify_id,
drop column if exists ticketmaster_id,
drop column if exists spotify_data,
drop column if exists ticketmaster_data,
drop column if exists genres,
drop column if exists popularity;

-- Update cached_shows to use artist_identifiers
alter table public.cached_shows
add column if not exists platform_id text;

-- Move ticketmaster_id to platform_id
update public.cached_shows
set platform_id = ticketmaster_id
where ticketmaster_id is not null;

alter table public.cached_shows
drop column if exists ticketmaster_id;

-- Update cached_songs to use artist_identifiers
alter table public.cached_songs
add column if not exists platform_id text;

-- Move spotify_id to platform_id
update public.cached_songs
set platform_id = spotify_id
where spotify_id is not null;

alter table public.cached_songs
drop column if exists spotify_id;

-- Add RLS policies
alter table public.artist_identifiers enable row level security;

create policy "Public read access"
on public.artist_identifiers for select
to anon, authenticated
using (true);

-- Create function to get artist by platform ID
create or replace function get_artist_by_platform_id(
    p_platform text,
    p_platform_id text
) returns uuid
language plpgsql
security definer
as $$
declare
    v_artist_id uuid;
begin
    select artist_id into v_artist_id
    from public.artist_identifiers
    where platform = p_platform
    and platform_id = p_platform_id
    limit 1;
    
    return v_artist_id;
end;
$$;

-- Create function to get platform ID by artist
create or replace function get_platform_id(
    p_artist_id uuid,
    p_platform text
) returns text
language plpgsql
security definer
as $$
declare
    v_platform_id text;
begin
    select platform_id into v_platform_id
    from public.artist_identifiers
    where artist_id = p_artist_id
    and platform = p_platform
    limit 1;
    
    return v_platform_id;
end;
$$;

-- Add helpful indexes
create index if not exists idx_cached_shows_platform_id 
on public.cached_shows (platform_id);

create index if not exists idx_cached_songs_platform_id 
on public.cached_songs (platform_id);

-- Update triggers for maintaining last_synced_at
create or replace function update_last_synced_at()
returns trigger as $$
begin
    new.last_synced_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_artist_identifier_last_synced
    before update on public.artist_identifiers
    for each row
    when (old.* is distinct from new.*)
    execute function update_last_synced_at();
