-- Database functions for TheSet app
-- Run this after setup-credentials.sql

-- Function to cast a vote (handles duplicate vote prevention)
CREATE OR REPLACE FUNCTION cast_vote(
  p_song_id TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Set secure search path to prevent schema-poisoning attacks
  SET search_path = public, pg_temp;
  -- Check if user has already voted for this song
  IF p_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_votes 
    WHERE user_id = p_user_id AND song_id = p_song_id
  ) THEN
    RAISE EXCEPTION 'User has already voted for this song' USING ERRCODE = '23505';
  END IF;
  
  -- Insert the vote
  IF p_user_id IS NOT NULL THEN
    INSERT INTO user_votes (user_id, song_id)
    VALUES (p_user_id, p_song_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check sync health
CREATE OR REPLACE FUNCTION check_sync_health(platform TEXT)
RETURNS TABLE(
  health_status TEXT,
  last_sync TEXT,
  error_rate NUMERIC
) AS $$
BEGIN
  -- Set secure search path to prevent schema-poisoning attacks
  SET search_path = public, pg_temp;
  RETURN QUERY
  SELECT 
    CASE 
      WHEN m.last_sync_time IS NULL THEN 'never_synced'
      WHEN m.last_sync_time < NOW() - INTERVAL '7 days' THEN 'stale'
      WHEN COALESCE(m.error_count, 0) > COALESCE(m.success_count, 0) * 0.5 THEN 'unhealthy'
      ELSE 'healthy'
    END AS health_status,
    COALESCE(m.last_sync_time::TEXT, 'never') AS last_sync,
    CASE 
      WHEN COALESCE(m.success_count, 0) + COALESCE(m.error_count, 0) = 0 THEN 0
      ELSE ROUND(COALESCE(m.error_count, 0)::NUMERIC / (COALESCE(m.success_count, 0) + COALESCE(m.error_count, 0)) * 100, 2)
    END AS error_rate
  FROM sync_metrics m
  WHERE m.platform = check_sync_health.platform;
  
  -- If no metrics exist, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'never_synced'::TEXT, 'never'::TEXT, 0::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if artist needs refresh
CREATE OR REPLACE FUNCTION needs_artist_refresh(
  last_sync TEXT,
  ttl_hours INT DEFAULT 72
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Set secure search path to prevent schema-poisoning attacks
  SET search_path = public, pg_temp;
  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN last_sync::TIMESTAMP < NOW() - (ttl_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if data needs sync
CREATE OR REPLACE FUNCTION needs_sync(
  last_sync TEXT,
  ttl_hours INT DEFAULT 24
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Set secure search path to prevent schema-poisoning attacks
  SET search_path = public, pg_temp;
  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN last_sync::TIMESTAMP < NOW() - (ttl_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if venue needs refresh
CREATE OR REPLACE FUNCTION needs_venue_refresh(
  last_sync TEXT,
  ttl_hours INT DEFAULT 168
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Set secure search path to prevent schema-poisoning attacks
  SET search_path = public, pg_temp;
  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN last_sync::TIMESTAMP < NOW() - (ttl_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to update sync metrics
CREATE OR REPLACE FUNCTION update_sync_metrics(
  p_platform TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Set secure search path to prevent schema-poisoning attacks
  SET search_path = public, pg_temp;
  -- Insert or update sync metrics
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
    
  -- Log sync event
  INSERT INTO sync_events (
    platform,
    entity_type,
    entity_id,
    status,
    error_message,
    metadata
  ) VALUES (
    p_platform,
    'sync_job',
    p_platform || '_' || NOW()::TEXT,
    CASE WHEN p_success THEN 'success' ELSE 'failed' END,
    p_error_message,
    jsonb_build_object(
      'timestamp', NOW(),
      'success', p_success
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_events_platform_created ON sync_events(platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_platform ON sync_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_user_votes_user_song ON user_votes(user_id, song_id);
CREATE INDEX IF NOT EXISTS idx_votes_show_song ON votes(show_id, song_id);
CREATE INDEX IF NOT EXISTS idx_cached_shows_artist_date ON cached_shows(artist_id, date);
CREATE INDEX IF NOT EXISTS idx_cached_songs_artist ON cached_songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id) WHERE spotify_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artists_ticketmaster_id ON artists(ticketmaster_id) WHERE ticketmaster_id IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cast_vote TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_sync_health TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_artist_refresh TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_sync TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_venue_refresh TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_sync_metrics TO service_role;