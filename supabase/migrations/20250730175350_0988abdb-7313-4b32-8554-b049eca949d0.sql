-- Fix critical database issues and add proper foreign keys

-- 1. First, add missing foreign key constraints
ALTER TABLE cached_shows 
ADD CONSTRAINT fk_cached_shows_artist_id 
FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;

-- 2. Create proper songs table with foreign keys (if it doesn't exist with proper structure)
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  album TEXT,
  popularity INTEGER,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spotify_id, artist_id)
);

-- 3. Fix votes table to use proper song references
CREATE TABLE IF NOT EXISTS setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  spotify_id TEXT,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  total_votes INTEGER DEFAULT 0,
  suggested BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create proper votes table linked to setlist_songs
CREATE TABLE IF NOT EXISTS song_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  setlist_song_id UUID NOT NULL REFERENCES setlist_songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setlist_song_id)
);

-- 5. Enable RLS on new tables
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_votes ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for setlist_songs
CREATE POLICY "Public can view setlist songs" 
ON setlist_songs FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage setlist songs" 
ON setlist_songs FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 7. Create RLS policies for song_votes  
CREATE POLICY "Users can view all votes" 
ON song_votes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own votes" 
ON song_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all votes" 
ON song_votes FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 8. Create function to get vote counts for setlist songs
CREATE OR REPLACE FUNCTION get_setlist_with_votes(setlist_uuid UUID)
RETURNS TABLE(
  id UUID,
  song_name TEXT,
  spotify_id TEXT,
  total_votes BIGINT,
  suggested BOOLEAN,
  order_index INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.song_name,
    ss.spotify_id,
    COALESCE(COUNT(sv.id), 0) as total_votes,
    ss.suggested,
    ss.order_index
  FROM setlist_songs ss
  LEFT JOIN song_votes sv ON ss.id = sv.setlist_song_id
  WHERE ss.setlist_id = setlist_uuid
  GROUP BY ss.id, ss.song_name, ss.spotify_id, ss.suggested, ss.order_index
  ORDER BY total_votes DESC, ss.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to cast votes
CREATE OR REPLACE FUNCTION cast_song_vote(
  p_setlist_song_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  vote_exists BOOLEAN;
BEGIN
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
  
  RETURN TRUE; -- Vote successful
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;