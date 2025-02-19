import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL ?? '',
    process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const migrationSQL = `
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
  `;

  try {
    console.log('Applying migration to create artist_identifiers table...');
    const { error } = await supabaseClient.rpc('execute_sql', { sql: migrationSQL });

    if (error) {
      console.error('Error applying migration:', error);
      return;
    }

    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Error applying migration:', error);
  }
})();