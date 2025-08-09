-- Update initialize_show_setlist to only insert 5 random songs
CREATE OR REPLACE FUNCTION initialize_show_setlist(
  p_show_id UUID,
  p_spotify_tracks JSONB DEFAULT '[]'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setlist_id UUID;
BEGIN
  -- If a setlist already exists for this show, return it
  SELECT id INTO v_setlist_id FROM setlists WHERE show_id = p_show_id;
  IF v_setlist_id IS NOT NULL THEN
    RETURN v_setlist_id;
  END IF;

  -- Create the parent setlist row
  INSERT INTO setlists (show_id, songs)
  VALUES (p_show_id, '[]'::jsonb)
  RETURNING id INTO v_setlist_id;

  -- Pick 5 random tracks from the provided JSONB array and insert them in order
  WITH picked AS (
    SELECT
      track->>'id'   AS spotify_id,
      track->>'name' AS song_name,
      ROW_NUMBER() OVER () AS rn
    FROM jsonb_array_elements(p_spotify_tracks) AS track
    ORDER BY random()
    LIMIT 5
  )
  INSERT INTO setlist_songs (
    setlist_id,
    song_name,
    spotify_id,
    suggested,
    order_index,
    total_votes
  )
  SELECT
    v_setlist_id,
    song_name,
    spotify_id,
    false,
    rn,
    0
  FROM picked;

  RETURN v_setlist_id;
END;
$$;
