-- Restore artists table from backup
begin;

-- Restore old columns
alter table public.artists
add column spotify_id text,
add column ticketmaster_id text,
add column spotify_data jsonb,
add column ticketmaster_data jsonb,
add column genres jsonb,
add column popularity integer;

-- Restore data from artist_identifiers
update public.artists a
set spotify_id = ai.platform_id
from public.artist_identifiers ai
where ai.artist_id = a.id
and ai.platform = 'spotify';

update public.artists a
set ticketmaster_id = ai.platform_id
from public.artist_identifiers ai
where ai.artist_id = a.id
and ai.platform = 'ticketmaster';

-- Restore data from metadata
update public.artists
set 
    genres = metadata->>'genres',
    popularity = (metadata->>'popularity')::integer,
    spotify_data = metadata->'spotify_data',
    ticketmaster_data = metadata->'ticketmaster_data'
where metadata is not null;

-- Restore cached_shows
alter table public.cached_shows
add column ticketmaster_id text;

update public.cached_shows
set ticketmaster_id = platform_id
where platform_id is not null;

alter table public.cached_shows
drop column platform_id;

-- Restore cached_songs
alter table public.cached_songs
add column spotify_id text;

update public.cached_songs
set spotify_id = platform_id
where platform_id is not null;

alter table public.cached_songs
drop column platform_id;

-- Drop new tables and functions
drop table if exists public.artist_identifiers;
drop function if exists get_artist_by_platform_id;
drop function if exists get_platform_id;
drop function if exists update_last_synced_at;

-- Clean up artists table
alter table public.artists
drop column metadata;

commit;
