-- TheSet Concert Setlist Voting App - Complete Database Schema
-- Supabase Instance: https://nxeokwzotcrumtywdnvd.supabase.co
-- Execute this script to set up the complete database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    spotify_id TEXT UNIQUE,
    ticketmaster_id TEXT UNIQUE,
    image_url TEXT,
    cover_image_url TEXT,
    genres JSONB DEFAULT '[]',
    classifications JSONB,
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    ticketmaster_id TEXT NOT NULL UNIQUE,
    city TEXT,
    state TEXT,
    country TEXT,
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shows table (normalized version of cached_shows)
CREATE TABLE IF NOT EXISTS shows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticketmaster_id TEXT NOT NULL UNIQUE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'upcoming',
    ticket_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached shows table (for API responses)
CREATE TABLE IF NOT EXISTS cached_shows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticketmaster_id TEXT NOT NULL UNIQUE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    venue_name TEXT,
    venue_location JSONB,
    ticket_url TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Songs table (normalized)
CREATE TABLE IF NOT EXISTS songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    spotify_id TEXT NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(spotify_id, artist_id)
);

-- Cached songs table (for API responses with additional metadata)
CREATE TABLE IF NOT EXISTS cached_songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    spotify_id TEXT NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    album TEXT,
    preview_url TEXT,
    popularity INTEGER,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(spotify_id, artist_id)
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    spotify_id TEXT UNIQUE,
    top_artists JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User artists (following relationship)
CREATE TABLE IF NOT EXISTS user_artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

-- Setlists table
CREATE TABLE IF NOT EXISTS setlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    songs JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(show_id)
);

-- User votes table (legacy, references songs)
CREATE TABLE IF NOT EXISTS user_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- Votes table (for show-specific voting)
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, show_id, song_id)
);

-- Platform identifiers for cross-platform tracking
CREATE TABLE IF NOT EXISTS platform_identifiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'artist', 'venue', 'song', etc.
    entity_id UUID NOT NULL,
    platform TEXT NOT NULL, -- 'spotify', 'ticketmaster', etc.
    platform_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, platform)
);

-- Sync events for tracking API synchronization
CREATE TABLE IF NOT EXISTS sync_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'artist', 'shows', 'songs', etc.
    entity_id UUID NOT NULL,
    platform TEXT NOT NULL, -- 'spotify', 'ticketmaster'
    status TEXT NOT NULL, -- 'success', 'error', 'pending'
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync metrics for monitoring API health
CREATE TABLE IF NOT EXISTS sync_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform TEXT NOT NULL,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_sync_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform)
);

-- Secrets table for API credentials
CREATE TABLE IF NOT EXISTS secrets (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Artists indexes
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artists_ticketmaster_id ON artists(ticketmaster_id);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artists_last_synced ON artists(last_synced_at);

-- Venues indexes
CREATE INDEX IF NOT EXISTS idx_venues_ticketmaster_id ON venues(ticketmaster_id);
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(city, state, country);

-- Shows indexes
CREATE INDEX IF NOT EXISTS idx_shows_artist_id ON shows(artist_id);
CREATE INDEX IF NOT EXISTS idx_shows_venue_id ON shows(venue_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
CREATE INDEX IF NOT EXISTS idx_shows_ticketmaster_id ON shows(ticketmaster_id);
CREATE INDEX IF NOT EXISTS idx_shows_status ON shows(status);

-- Cached shows indexes
CREATE INDEX IF NOT EXISTS idx_cached_shows_artist_id ON cached_shows(artist_id);
CREATE INDEX IF NOT EXISTS idx_cached_shows_date ON cached_shows(date);
CREATE INDEX IF NOT EXISTS idx_cached_shows_last_synced ON cached_shows(last_synced_at);

-- Songs indexes
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);

-- Cached songs indexes
CREATE INDEX IF NOT EXISTS idx_cached_songs_artist_id ON cached_songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_cached_songs_spotify_id ON cached_songs(spotify_id);
CREATE INDEX IF NOT EXISTS idx_cached_songs_popularity ON cached_songs(popularity);

-- User relationships indexes
CREATE INDEX IF NOT EXISTS idx_user_artists_user_id ON user_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_artists_artist_id ON user_artists(artist_id);

-- Voting indexes
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_song_id ON user_votes(song_id);
CREATE INDEX IF NOT EXISTS idx_votes_show_id ON votes(show_id);
CREATE INDEX IF NOT EXISTS idx_votes_song_id ON votes(song_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Sync tracking indexes
CREATE INDEX IF NOT EXISTS idx_sync_events_entity ON sync_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_platform ON sync_events(platform);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON sync_events(status);
CREATE INDEX IF NOT EXISTS idx_sync_events_created_at ON sync_events(created_at);

-- Platform identifiers indexes
CREATE INDEX IF NOT EXISTS idx_platform_identifiers_entity ON platform_identifiers(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_platform_identifiers_platform ON platform_identifiers(platform, platform_id);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if data needs synchronization
CREATE OR REPLACE FUNCTION needs_sync(
    last_sync TIMESTAMPTZ,
    ttl_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- If never synced, needs sync
    IF last_sync IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- If older than TTL, needs sync
    RETURN (NOW() - last_sync) > (ttl_hours || ' hours')::INTERVAL;
END;
$$;

-- Function to check if artist data needs refresh
CREATE OR REPLACE FUNCTION needs_artist_refresh(
    last_sync TIMESTAMPTZ,
    ttl_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN needs_sync(last_sync, ttl_hours);
END;
$$;

-- Function to check if venue data needs refresh
CREATE OR REPLACE FUNCTION needs_venue_refresh(
    last_sync TIMESTAMPTZ,
    ttl_hours INTEGER DEFAULT 720 -- 30 days
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN needs_sync(last_sync, ttl_hours);
END;
$$;

-- Function to update sync metrics
CREATE OR REPLACE FUNCTION update_sync_metrics(
    p_platform TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO sync_metrics (platform, success_count, error_count, last_sync_time)
    VALUES (
        p_platform,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        NOW()
    )
    ON CONFLICT (platform) DO UPDATE SET
        success_count = sync_metrics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        error_count = sync_metrics.error_count + CASE WHEN p_success THEN 0 ELSE 1 END,
        last_sync_time = NOW(),
        updated_at = NOW();
        
    -- Log the sync event
    INSERT INTO sync_events (entity_type, entity_id, platform, status, error_message)
    VALUES (
        'sync_metrics',
        gen_random_uuid(),
        p_platform,
        CASE WHEN p_success THEN 'success' ELSE 'error' END,
        p_error_message
    );
END;
$$;

-- Function to check sync health
CREATE OR REPLACE FUNCTION check_sync_health(platform TEXT)
RETURNS TABLE(
    health_status TEXT,
    last_sync TEXT,
    error_rate DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN sm.last_sync_time IS NULL THEN 'never_synced'
            WHEN (NOW() - sm.last_sync_time) > INTERVAL '1 day' THEN 'stale'
            WHEN (sm.error_count::DECIMAL / NULLIF(sm.success_count + sm.error_count, 0)) > 0.1 THEN 'high_error_rate'
            ELSE 'healthy'
        END as health_status,
        COALESCE(sm.last_sync_time::TEXT, 'never') as last_sync,
        COALESCE(sm.error_count::DECIMAL / NULLIF(sm.success_count + sm.error_count, 0), 0) as error_rate
    FROM sync_metrics sm
    WHERE sm.platform = check_sync_health.platform;
END;
$$;

-- Function to cast a vote (handles both user and anonymous voting)
CREATE OR REPLACE FUNCTION cast_vote(
    p_song_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- For authenticated users, use user_votes table
    IF p_user_id IS NOT NULL THEN
        INSERT INTO user_votes (user_id, song_id)
        VALUES (p_user_id, p_song_id)
        ON CONFLICT (user_id, song_id) DO NOTHING;
    END IF;
    
    -- Additional logic for IP-based voting could be added here
    -- For now, we only handle authenticated user voting
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Public read access for core data
CREATE POLICY "Public read access" ON artists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shows FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cached_shows FOR SELECT USING (true);
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cached_songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON platform_identifiers FOR SELECT USING (true);

-- User can only see their own user record
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- User artists - users can manage their own follows
CREATE POLICY "Users can view own artist follows" ON user_artists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own artist follows" ON user_artists FOR ALL USING (auth.uid() = user_id);

-- User votes - users can manage their own votes
CREATE POLICY "Users can view own votes" ON user_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own votes" ON user_votes FOR ALL USING (auth.uid() = user_id);

-- Show votes - users can manage their own votes
CREATE POLICY "Users can view own show votes" ON votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own show votes" ON votes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view vote counts" ON votes FOR SELECT USING (true);

-- Service role can manage all data
CREATE POLICY "Service role full access" ON artists FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON venues FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON shows FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON cached_shows FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON songs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON cached_songs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON user_artists FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON setlists FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON user_votes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON votes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON platform_identifiers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON sync_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON sync_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role full access" ON secrets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert API credentials into secrets table
INSERT INTO secrets (key, value) 
VALUES ('TICKETMASTER_API_KEY', 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

INSERT INTO secrets (key, value) 
VALUES 
  ('SPOTIFY_CLIENT_ID', '2946864dc822469b9c672292ead45f43'),
  ('SPOTIFY_CLIENT_SECRET', 'feaf0fc901124b839b11e02f97d18a8d')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Initialize sync metrics for platforms
INSERT INTO sync_metrics (platform, success_count, error_count)
VALUES 
  ('spotify', 0, 0),
  ('ticketmaster', 0, 0)
ON CONFLICT (platform) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify secrets were inserted
SELECT key, 
       CASE 
         WHEN LENGTH(value) > 10 THEN CONCAT(LEFT(value, 10), '...')
         ELSE value 
       END as value_preview,
       created_at 
FROM secrets
ORDER BY key;

-- Verify functions were created
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('needs_sync', 'needs_artist_refresh', 'needs_venue_refresh', 'update_sync_metrics', 'check_sync_health', 'cast_vote')
ORDER BY routine_name;

-- Schema creation completed successfully!