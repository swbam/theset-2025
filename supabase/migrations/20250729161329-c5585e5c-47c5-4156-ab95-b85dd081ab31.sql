-- Security fix: Update all database functions with secure search_path
-- This prevents schema-poisoning attacks

-- Drop and recreate all functions with security fixes
DROP FUNCTION IF EXISTS cast_vote(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS check_sync_health(TEXT);
DROP FUNCTION IF EXISTS needs_artist_refresh(TEXT, INT);
DROP FUNCTION IF EXISTS needs_sync(TEXT, INT);
DROP FUNCTION IF EXISTS needs_venue_refresh(TEXT, INT);
DROP FUNCTION IF EXISTS update_sync_metrics(TEXT, BOOLEAN, TEXT);

-- Function to cast a vote (handles duplicate vote prevention)
CREATE OR REPLACE FUNCTION cast_vote(
  p_song_id TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if user has already voted for this song
  IF p_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_votes 
    WHERE user_id = p_user_id::uuid AND song_id = p_song_id::uuid
  ) THEN
    RAISE EXCEPTION 'User has already voted for this song' USING ERRCODE = '23505';
  END IF;
  
  -- Insert the vote
  IF p_user_id IS NOT NULL THEN
    INSERT INTO user_votes (user_id, song_id)
    VALUES (p_user_id::uuid, p_song_id::uuid);
  END IF;
END;
$$;

-- Function to check sync health
CREATE OR REPLACE FUNCTION check_sync_health(platform TEXT)
RETURNS TABLE(
  health_status TEXT,
  last_sync TEXT,
  error_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
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
$$;

-- Function to check if artist needs refresh
CREATE OR REPLACE FUNCTION needs_artist_refresh(
  last_sync TEXT,
  ttl_hours INT DEFAULT 72
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN last_sync::TIMESTAMP < NOW() - (ttl_hours || ' hours')::INTERVAL;
END;
$$;

-- Function to check if data needs sync
CREATE OR REPLACE FUNCTION needs_sync(
  last_sync TEXT,
  ttl_hours INT DEFAULT 24
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN last_sync::TIMESTAMP < NOW() - (ttl_hours || ' hours')::INTERVAL;
END;
$$;

-- Function to check if venue needs refresh
CREATE OR REPLACE FUNCTION needs_venue_refresh(
  last_sync TEXT,
  ttl_hours INT DEFAULT 168
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN last_sync::TIMESTAMP < NOW() - (ttl_hours || ' hours')::INTERVAL;
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
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
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
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cast_vote TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_sync_health TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_artist_refresh TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_sync TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_venue_refresh TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_sync_metrics TO service_role;