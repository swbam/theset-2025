-- Drop triggers
DROP TRIGGER IF EXISTS refresh_vote_counts_trigger ON vote_logs;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

-- Drop functions
DROP FUNCTION IF EXISTS refresh_vote_counts();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS cast_vote(UUID, UUID, TEXT);

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS public.song_vote_counts;

-- Drop indexes
DROP INDEX IF EXISTS idx_setlist_songs_votes;
DROP INDEX IF EXISTS idx_cached_shows_date;
DROP INDEX IF EXISTS idx_artist_identifiers_platform;
DROP INDEX IF EXISTS idx_vote_logs_user_recent;
DROP INDEX IF EXISTS idx_vote_logs_ip_recent;

-- Drop policies
DROP POLICY IF EXISTS "Users can read their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can read their own votes" ON public.vote_logs;
DROP POLICY IF EXISTS "Users can insert votes" ON public.vote_logs;

-- Drop tables
DROP TABLE IF EXISTS public.vote_logs;
DROP TABLE IF EXISTS public.user_preferences;
