-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users,
    default_location TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vote logs table for better tracking and rate limiting
CREATE TABLE IF NOT EXISTS public.vote_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    song_id UUID REFERENCES public.setlist_songs,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_setlist_songs_votes 
ON public.setlist_songs (setlist_id, total_votes DESC);

CREATE INDEX IF NOT EXISTS idx_cached_shows_date 
ON public.cached_shows (date DESC);

CREATE INDEX IF NOT EXISTS idx_artist_identifiers_platform 
ON public.artist_identifiers (platform, platform_id);

-- Add materialized view for vote counts
CREATE MATERIALIZED VIEW public.song_vote_counts AS
SELECT 
    ss.id as song_id,
    ss.setlist_id,
    COUNT(vl.id) as vote_count,
    s.show_id,
    s.name as setlist_name,
    cs.artist_id
FROM setlist_songs ss
JOIN setlists s ON s.id = ss.setlist_id
JOIN cached_shows cs ON cs.id = s.show_id
LEFT JOIN vote_logs vl ON vl.song_id = ss.id
GROUP BY ss.id, ss.setlist_id, s.show_id, s.name, cs.artist_id;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY song_vote_counts;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh vote counts
CREATE TRIGGER refresh_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON vote_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_vote_counts();

-- Add function for atomic vote operations
CREATE OR REPLACE FUNCTION cast_vote(
    p_song_id UUID,
    p_user_id UUID,
    p_ip_address TEXT
)
RETURNS VOID AS $$
DECLARE
    v_vote_count INTEGER;
BEGIN
    -- Check rate limiting for IP address (if anonymous)
    IF p_user_id IS NULL THEN
        SELECT COUNT(*)
        INTO v_vote_count
        FROM vote_logs
        WHERE ip_address = p_ip_address
        AND created_at > NOW() - INTERVAL '1 hour';

        IF v_vote_count >= 5 THEN
            RAISE EXCEPTION 'Rate limit exceeded for anonymous votes';
        END IF;
    END IF;

    -- Check rate limiting for user
    IF p_user_id IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_vote_count
        FROM vote_logs
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '1 hour';

        IF v_vote_count >= 20 THEN
            RAISE EXCEPTION 'Rate limit exceeded for user votes';
        END IF;
    END IF;

    -- Insert vote log
    INSERT INTO vote_logs (song_id, user_id, ip_address)
    VALUES (p_song_id, p_user_id, p_ip_address);

    -- Update vote count
    UPDATE setlist_songs
    SET total_votes = total_votes + 1
    WHERE id = p_song_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_logs ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can read their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Vote logs policies
CREATE POLICY "Users can read their own votes"
    ON public.vote_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert votes"
    ON public.vote_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND ip_address IS NOT NULL)
    );

-- Add updated_at trigger for user_preferences
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vote_logs_user_recent
ON public.vote_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vote_logs_ip_recent
ON public.vote_logs (ip_address, created_at DESC);
