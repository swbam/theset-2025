-- Fix data architecture by creating migration functions and triggers

-- 1. Create function to migrate cached_shows to shows
CREATE OR REPLACE FUNCTION migrate_cached_shows_to_shows()
RETURNS void AS $$
BEGIN
  -- First ensure venues exist for cached shows
  INSERT INTO venues (ticketmaster_id, name, city, state, country, metadata)
  SELECT DISTINCT
    CONCAT('venue_', cs.venue_name, '_', COALESCE(cs.venue_location->>'city', 'unknown')),
    cs.venue_name,
    cs.venue_location->>'city',
    cs.venue_location->'state'->>'name',
    cs.venue_location->'country'->>'name',
    COALESCE(cs.venue_location, '{}'::jsonb)
  FROM cached_shows cs
  WHERE cs.venue_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM venues v 
    WHERE v.name = cs.venue_name 
    AND COALESCE(v.city, '') = COALESCE(cs.venue_location->>'city', '')
  )
  ON CONFLICT (ticketmaster_id) DO NOTHING;

  -- Then migrate shows
  INSERT INTO shows (ticketmaster_id, artist_id, venue_id, date, status, ticket_url)
  SELECT DISTINCT ON (cs.ticketmaster_id)
    cs.ticketmaster_id,
    cs.artist_id,
    v.id as venue_id,
    cs.date,
    CASE 
      WHEN cs.date < NOW() THEN 'completed'
      ELSE 'upcoming'
    END as status,
    cs.ticket_url
  FROM cached_shows cs
  LEFT JOIN venues v ON (
    v.name = cs.venue_name 
    AND COALESCE(v.city, '') = COALESCE(cs.venue_location->>'city', '')
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM shows s WHERE s.ticketmaster_id = cs.ticketmaster_id
  )
  AND cs.artist_id IS NOT NULL
  AND v.id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to migrate cached_songs to songs
CREATE OR REPLACE FUNCTION migrate_cached_songs_to_songs()
RETURNS void AS $$
BEGIN
  INSERT INTO songs (spotify_id, artist_id, title)
  SELECT DISTINCT ON (cs.spotify_id, cs.artist_id)
    cs.spotify_id,
    cs.artist_id,
    cs.name as title
  FROM cached_songs cs
  WHERE NOT EXISTS (
    SELECT 1 FROM songs s WHERE s.spotify_id = cs.spotify_id AND s.artist_id = cs.artist_id
  )
  AND cs.artist_id IS NOT NULL
  AND cs.spotify_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create auto-migration triggers
CREATE OR REPLACE FUNCTION auto_migrate_shows()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM migrate_cached_shows_to_shows();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_migrate_songs()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM migrate_cached_songs_to_songs();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_migrate_shows ON cached_shows;
DROP TRIGGER IF EXISTS trigger_migrate_songs ON cached_songs;

-- Create new triggers
CREATE TRIGGER trigger_migrate_shows
  AFTER INSERT ON cached_shows
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_migrate_shows();

CREATE TRIGGER trigger_migrate_songs
  AFTER INSERT ON cached_songs
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_migrate_songs();

-- 4. Run initial migration for existing data
SELECT migrate_cached_shows_to_shows();
SELECT migrate_cached_songs_to_songs();

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION migrate_cached_shows_to_shows TO service_role;
GRANT EXECUTE ON FUNCTION migrate_cached_songs_to_songs TO service_role;
GRANT EXECUTE ON FUNCTION auto_migrate_shows TO service_role;
GRANT EXECUTE ON FUNCTION auto_migrate_songs TO service_role;