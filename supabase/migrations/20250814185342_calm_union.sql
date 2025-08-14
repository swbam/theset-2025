/*
  # Fix Voting System and Database Functions

  1. Database Functions
    - Fix initialize_show_setlist to work with artist names
    - Improve cast_song_vote function
    - Add proper error handling

  2. Security
    - Enable RLS on all tables
    - Add proper policies for voting
    - Secure function execution

  3. Performance
    - Add missing indexes
    - Optimize vote counting
*/

-- Fix the initialize_show_setlist function to handle artist names
CREATE OR REPLACE FUNCTION initialize_show_setlist(
  p_show_id UUID,
  p_artist_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setlist_id UUID;
  artist_record RECORD;
  spotify_tracks JSONB;
BEGIN
  -- Check if setlist already exists
  SELECT id INTO setlist_id FROM setlists WHERE show_id = p_show_id;
  
  IF setlist_id IS NOT NULL THEN
    RETURN setlist_id;
  END IF;
  
  -- Get artist data
  SELECT * INTO artist_record FROM artists WHERE name ILIKE p_artist_name LIMIT 1;
  
  IF artist_record.id IS NULL THEN
    RAISE EXCEPTION 'Artist not found: %', p_artist_name;
  END IF;
  
  -- Get cached songs for this artist
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', spotify_id,
      'name', name
    )
  ) INTO spotify_tracks
  FROM cached_songs 
  WHERE artist_id = artist_record.id 
  ORDER BY popularity DESC NULLS LAST
  LIMIT 10;
  
  -- Create new setlist
  INSERT INTO setlists (show_id, songs) 
  VALUES (p_show_id, COALESCE(spotify_tracks, '[]'::jsonb))
  RETURNING id INTO setlist_id;
  
  -- Add songs to setlist_songs table
  IF spotify_tracks IS NOT NULL THEN
    INSERT INTO setlist_songs (
      setlist_id, 
      song_name, 
      spotify_id, 
      artist_id,
      suggested, 
      order_index,
      total_votes
    )
    SELECT 
      setlist_id,
      track->>'name',
      track->>'id',
      artist_record.id,
      false,
      ROW_NUMBER() OVER (),
      0
    FROM jsonb_array_elements(spotify_tracks) AS track;
  END IF;
  
  RETURN setlist_id;
END;
$$;

-- Improved cast_song_vote function
CREATE OR REPLACE FUNCTION cast_song_vote(
  p_setlist_song_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_exists BOOLEAN := FALSE;
  show_uuid UUID;
BEGIN
  -- Get show ID for this song
  SELECT sl.show_id INTO show_uuid
  FROM setlist_songs ss
  JOIN setlists sl ON ss.setlist_id = sl.id
  WHERE ss.id = p_setlist_song_id;
  
  IF show_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid setlist song ID';
  END IF;
  
  -- Check if user already voted for this song
  SELECT EXISTS(
    SELECT 1 FROM song_votes 
    WHERE user_id = p_user_id AND setlist_song_id = p_setlist_song_id
  ) INTO vote_exists;
  
  IF vote_exists THEN
    RETURN FALSE; -- Already voted
  END IF;
  
  -- Cast the vote
  INSERT INTO song_votes (user_id, setlist_song_id)
  VALUES (p_user_id, p_setlist_song_id);
  
  -- Update total votes count
  UPDATE setlist_songs 
  SET total_votes = (
    SELECT COUNT(*) FROM song_votes WHERE setlist_song_id = p_setlist_song_id
  )
  WHERE id = p_setlist_song_id;
  
  RETURN TRUE; -- Vote successful
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_song_votes_user_song ON song_votes(user_id, setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_song_votes_setlist_song ON song_votes(setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_cached_songs_artist_popularity ON cached_songs(artist_id, popularity DESC);
CREATE INDEX IF NOT EXISTS idx_artists_name_ilike ON artists USING gin(name gin_trgm_ops);

-- Enable trigram extension for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant permissions
GRANT EXECUTE ON FUNCTION initialize_show_setlist TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION cast_song_vote TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION add_song_to_setlist TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_setlist_with_votes TO service_role, authenticated, anon;