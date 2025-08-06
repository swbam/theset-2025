-- Postgres function to cast a vote on a song for a setlist / show.
-- Enforces one vote per song per user via a unique index.

-- Unique index (create once when migrations run)
CREATE UNIQUE INDEX IF NOT EXISTS user_votes_unique ON public.user_votes (user_id, song_id);

-- RPC Function
CREATE OR REPLACE FUNCTION public.vote_on_song(
  p_user_id uuid,
  p_song_id uuid,
  p_setlist_id uuid,
  p_show_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_votes (user_id, song_id, setlist_id, show_id)
  VALUES (p_user_id, p_song_id, p_setlist_id, p_show_id);
END;
$$;

-- Notify realtime channel when a vote row is inserted
CREATE OR REPLACE FUNCTION public.notify_vote_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  channel text := 'show:' || NEW.show_id;
BEGIN
  PERFORM pg_notify(channel, 'vote');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_vote ON public.user_votes;
CREATE TRIGGER trg_notify_vote
AFTER INSERT ON public.user_votes
FOR EACH ROW EXECUTE FUNCTION public.notify_vote_insert();

