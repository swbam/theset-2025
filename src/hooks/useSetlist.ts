
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export function useSetlist(showId: string | undefined, user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSetlistMutation = useMutation({
    mutationFn: async ({ showName, venueId }: { showName: string; venueId?: string }) => {
      if (!showId || !user) return null;
      
      const { data: setlist, error } = await supabase
        .from('setlists')
        .insert({
          show_id: showId,
          name: showName,
          created_by: user.id,
          venue_id: venueId,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating setlist:', error);
        throw error;
      }

      return setlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', showId] });
    },
    onError: (error) => {
      console.error('Error creating setlist:', error);
      toast({
        title: "Error",
        description: "Failed to create setlist",
        variant: "destructive"
      });
    }
  });

  const addSongMutation = useMutation({
    mutationFn: async ({ songName, setlistId }: { songName: string; setlistId: string }) => {
      if (!user) {
        throw new Error('Must be logged in to suggest songs');
      }

      const { data: song, error } = await supabase
        .from('setlist_songs')
        .insert({
          setlist_id: setlistId,
          song_name: songName,
          suggested: true
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
    ...useQuery({
      queryKey: ['setlist', showId],
      queryFn: async () => {
        console.log('Fetching setlist for show:', showId);
        const { data: setlist, error } = await supabase
          .from('setlists')
          .select(`
            *,
            songs:setlist_songs(
              id,
              song_name,
              total_votes,
              suggested
            )
          `)
          .eq('show_id', showId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching setlist:', error);
          return null;
        }

        // If no setlist exists and user is authenticated, create one
        if (!setlist && user && showId) {
          console.log('No setlist found, creating new one');
          createSetlistMutation.mutate({
            showName: '', // This will be set in the component
            venueId: undefined
          });
          return null;
        }

        return setlist;
      },
      enabled: !!showId,
    }),
    addSong: addSongMutation.mutate
  };
}
