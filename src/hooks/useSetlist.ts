
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { useSpotifyTracks } from "./useSpotifyTracks";

interface SetlistSong {
  id: string;
  setlist_id: string;
  song_name: string;
  votes: number;
  is_top_track: boolean;
  spotify_id?: string;
  suggested?: boolean;
}

interface Setlist {
  id: string;
  show_id: string;
  name: string;
  created_by: string;
  created_at: string;
  status: string;
  songs: SetlistSong[];
}

export function useSetlist(showId: string | undefined, user: User | null, artistName?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: spotifyTracks } = useSpotifyTracks(artistName, showId);

  const createSetlistMutation = useMutation({
    mutationFn: async ({ showName, venueId }: { showName: string; venueId?: string }) => {
      if (!showId || !user) return null;
      
      console.log('Creating new setlist for show:', showId);
      
      // First check if a setlist already exists
      const { data: existingSetlist } = await supabase
        .from('setlists')
        .select('*')
        .eq('show_id', showId)
        .maybeSingle();

      if (existingSetlist) {
        console.log('Setlist already exists:', existingSetlist.id);
        return existingSetlist;
      }

      const { data: setlist, error } = await supabase
        .from('setlists')
        .insert({
          show_id: showId,
          name: showName || 'Untitled Setlist',
          created_by: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating setlist:', error);
        throw error;
      }

      // If we have Spotify tracks, add them to the setlist
      if (spotifyTracks && spotifyTracks.length > 0) {
        const { error: songsError } = await supabase
          .from('setlist_songs')
          .insert(
            spotifyTracks.map(track => ({
              setlist_id: setlist.id,
              song_name: track.song_name,
              spotify_id: track.spotify_id,
              is_top_track: true,
              votes: 0,
              suggested: false
            }))
          );

        if (songsError) {
          console.error('Error adding Spotify tracks:', songsError);
          // Don't throw, just log the error since the setlist was created
        }
      }

      console.log('Created new setlist:', setlist.id);
      return setlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', showId] });
    }
  });

  const addSongMutation = useMutation({
    mutationFn: async ({ songName, setlistId, spotifyId }: { songName: string; setlistId: string; spotifyId?: string }) => {
      if (!user) {
        throw new Error('Must be logged in to suggest songs');
      }

      const { data: song, error } = await supabase
        .from('setlist_songs')
        .insert({
          setlist_id: setlistId,
          song_name: songName,
          spotify_id: spotifyId,
          suggested: true,
          votes: 0
        })
        .select()
        .single();

      if (error) throw error;
      return song;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', showId] });
      toast({
        title: "Success",
        description: "Song suggestion added successfully"
      });
    },
    onError: (error) => {
      console.error('Error adding song:', error);
      toast({
        title: "Error",
        description: "Failed to add song suggestion",
        variant: "destructive"
      });
    }
  });

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
        const newSetlist = await createSetlistMutation.mutateAsync({
          showName: '',
        });
        return newSetlist as Setlist;
      }

      return null;
    },
    enabled: !!showId
  });

  return {
    data: setlist,
    addSong: addSongMutation.mutate,
    isLoading: createSetlistMutation.isPending
  };
}
