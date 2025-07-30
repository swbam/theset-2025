-- Enable real-time for votes table only (setlist_songs already exists)
ALTER TABLE votes REPLICA IDENTITY FULL;

-- Add votes table to realtime publication (setlist_songs already added)
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Function to initialize a show setlist with Spotify top tracks
CREATE OR REPLACE FUNCTION initialize_show_setlist(
  p_show_id UUID,
  p_spotify_tracks JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setlist_id UUID;
  track JSONB;
  order_idx INTEGER := 1;
BEGIN
  -- Check if setlist already exists
  SELECT id INTO setlist_id FROM setlists WHERE show_id = p_show_id;
  
  IF setlist_id IS NOT NULL THEN
    RETURN setlist_id;
  END IF;
  
  -- Create new setlist
  INSERT INTO setlists (show_id, songs) 
  VALUES (p_show_id, '[]'::jsonb)
  RETURNING id INTO setlist_id;
  
  -- Add Spotify tracks to setlist
  FOR track IN SELECT * FROM jsonb_array_elements(p_spotify_tracks)
  LOOP
    INSERT INTO setlist_songs (
      setlist_id, 
      song_name, 
      spotify_id, 
      suggested, 
      order_index,
      total_votes
    ) VALUES (
      setlist_id,
      track->>'name',
      track->>'id',
      false,
      order_idx,
      0
    );
    order_idx := order_idx + 1;
  END LOOP;
  
  RETURN setlist_id;
END;
$$;

-- Function to add a song suggestion to setlist
CREATE OR REPLACE FUNCTION add_song_to_setlist(
  p_setlist_id UUID,
  p_song_name TEXT,
  p_spotify_id TEXT,
  p_suggested BOOLEAN DEFAULT true
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  song_id UUID;
  max_order INTEGER;
BEGIN
  -- Get current max order
  SELECT COALESCE(MAX(order_index), 0) INTO max_order
  FROM setlist_songs WHERE setlist_id = p_setlist_id;
  
  -- Insert new song
  INSERT INTO setlist_songs (
    setlist_id,
    song_name,
    spotify_id,
    suggested,
    order_index,
    total_votes
  ) VALUES (
    p_setlist_id,
    p_song_name,
    p_spotify_id,
    p_suggested,
    max_order + 1,
    0
  ) RETURNING id INTO song_id;
  
  RETURN song_id;
END;
$$;

-- Function to cast a vote on a setlist song
CREATE OR REPLACE FUNCTION cast_setlist_vote(
  p_setlist_song_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
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
  
  -- Check for authenticated user vote
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM votes 
      WHERE user_id = p_user_id 
      AND song_id = p_setlist_song_id
    ) INTO vote_exists;
    
    IF vote_exists THEN
      RETURN FALSE;
    END IF;
    
    -- Cast vote
    INSERT INTO votes (user_id, song_id, show_id)
    VALUES (p_user_id, p_setlist_song_id, show_uuid);
    
  ELSE
    -- Handle guest voting with IP tracking
    IF p_ip_address IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM guest_actions 
        WHERE ip_address = p_ip_address 
        AND action_type = 'vote'
        AND entity_id = p_setlist_song_id
      ) INTO vote_exists;
      
      IF vote_exists THEN
        RETURN FALSE;
      END IF;
      
      -- Record guest action
      INSERT INTO guest_actions (ip_address, action_type, entity_id)
      VALUES (p_ip_address, 'vote', p_setlist_song_id);
      
      -- Cast vote with temporary user ID
      INSERT INTO votes (user_id, song_id, show_id)
      VALUES (gen_random_uuid(), p_setlist_song_id, show_uuid);
    END IF;
  END IF;
  
  -- Update vote count
  UPDATE setlist_songs 
  SET total_votes = (
    SELECT COUNT(*) FROM votes WHERE song_id = p_setlist_song_id
  )
  WHERE id = p_setlist_song_id;
  
  RETURN TRUE;
END;
$$;