
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../components/ui/use-toast";
import type { User } from "@supabase/supabase-js";
import type { CreateSetlistParams, AddSongParams, Setlist } from "../types/setlist";

export function useSetlistMutations(showId: string | undefined, user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSetlistMutation = useMutation({
    mutationFn: async ({ showName }: CreateSetlistParams) => {
      if (!showId || !user) return null;
      
      console.log('Creating new setlist for show:', showId);
      
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

      console.log('Created new setlist:', setlist.id);
      return setlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', showId] });
    }
  });

  const addSongMutation = useMutation({
    mutationFn: async ({ songName, setlistId, spotifyId }: AddSongParams) => {
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

  return {
    createSetlist: createSetlistMutation.mutateAsync,
    addSong: addSongMutation.mutate,
    isLoading: createSetlistMutation.isPending
  };
}
