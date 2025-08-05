-- Adds an existing cached song to a setlist (JSON column)

CREATE OR REPLACE FUNCTION public.add_song_to_setlist(
  p_setlist_id uuid,
  p_song_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_songs jsonb;
BEGIN
  SELECT songs INTO current_songs FROM public.setlists WHERE id = p_setlist_id;

  IF current_songs ?| ARRAY[p_song_id] THEN
    -- song already in setlist, do nothing
    RETURN;
  END IF;

  UPDATE public.setlists
  SET songs = COALESCE(songs, '[]'::jsonb) || jsonb_build_object('id', p_song_id, 'suggested', true)
  WHERE id = p_setlist_id;
END;
$$;

