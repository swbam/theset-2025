-- Security fix: Update all database functions with secure search_path
-- This prevents schema-poisoning attacks

-- Drop functions with specific signatures to avoid conflicts
DROP FUNCTION IF EXISTS cast_vote(p_song_id uuid, p_user_id uuid, p_ip_address text);
DROP FUNCTION IF EXISTS check_sync_health(platform text);
DROP FUNCTION IF EXISTS needs_artist_refresh(last_sync timestamp with time zone, ttl_hours integer);
DROP FUNCTION IF EXISTS needs_sync(last_sync timestamp with time zone, ttl_hours integer);
DROP FUNCTION IF EXISTS needs_venue_refresh(last_sync timestamp with time zone, ttl_hours integer);
DROP FUNCTION IF EXISTS update_sync_metrics(p_platform text, p_success boolean, p_error_message text);

-- Function to cast a vote (handles duplicate vote prevention)
CREATE OR REPLACE FUNCTION cast_vote(
  p_song_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Function to check sync health
CREATE OR REPLACE FUNCTION check_sync_health(platform text)
RETURNS TABLE(
  health_status text,
  last_sync text,
  error_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Function to check if artist needs refresh
CREATE OR REPLACE FUNCTION needs_artist_refresh(
  last_sync timestamp with time zone,
  ttl_hours integer DEFAULT 168
)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN needs_sync(last_sync, ttl_hours);
END;
$$;

-- Function to check if data needs sync
CREATE OR REPLACE FUNCTION needs_sync(
  last_sync timestamp with time zone,
  ttl_hours integer DEFAULT 24
)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Function to check if venue needs refresh
CREATE OR REPLACE FUNCTION needs_venue_refresh(
  last_sync timestamp with time zone,
  ttl_hours integer DEFAULT 720
)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN needs_sync(last_sync, ttl_hours);
END;
$$;

-- Function to update sync metrics
CREATE OR REPLACE FUNCTION update_sync_metrics(
  p_platform text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cast_vote TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_sync_health TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_artist_refresh TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_sync TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION needs_venue_refresh TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_sync_metrics TO service_role;