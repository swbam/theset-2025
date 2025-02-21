
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useSpotifyTracks } from "./useSpotifyTracks";
import { useSetlistMutations } from "../mutations/useSetlistMutations";
import type { Setlist } from "../types/setlist";

export function useSetlist(showId: string | undefined, user: User | null, artistName?: string) {
  const { data: spotifyTracks } = useSpotifyTracks(artistName, showId);
  const { createSetlist, addSong, isLoading } = useSetlistMutations(showId, user);

  const { data: setlist } = useQuery({
    queryKey: ['setlist', showId],
    queryFn: async () => {
      if (!showId) {
        console.log('No show ID provided for setlist query');
        return null;
      }

      console.log('Fetching setlist for show:', showId);
      
      const { data: existingSetlist, error: fetchError } = await supabase
        .from('setlists')
        .select(`
          id,
          show_id,
          created_by,
          name,
          created_at,
          status,
          songs:setlist_songs(
            id,
            song_name,
            votes,
            suggested,
            spotify_id,
            is_top_track
          )
        `)
        .eq('show_id', showId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching setlist:', fetchError);
        throw fetchError;
      }

      if (existingSetlist) {
        return existingSetlist as Setlist;
      }

      if (user) {
        const newSetlist = await createSetlist({
          showName: '',
        });

        // If we have Spotify tracks, add them to the setlist
        if (newSetlist && spotifyTracks && spotifyTracks.length > 0) {
          const { error: songsError } = await supabase
            .from('setlist_songs')
            .insert(
              spotifyTracks.map(track => ({
                setlist_id: newSetlist.id,
                song_name: track.song_name,
                spotify_id: track.spotify_id,
                is_top_track: true,
                votes: 0,
                suggested: false
              }))
            );

          if (songsError) {
            console.error('Error adding Spotify tracks:', songsError);
          }
        }

        return newSetlist as Setlist;
      }

      return null;
    },
    enabled: !!showId
  });

  return {
    data: setlist,
    addSong,
    isLoading
  };
}
