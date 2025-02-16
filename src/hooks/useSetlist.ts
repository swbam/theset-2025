
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { useEffect } from "react";

export function useSetlist(showId: string | undefined, user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          venue_id: venueId,
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
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['setlist', showId] });
      }
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

  const { data: setlist, ...queryResult } = useQuery({
    queryKey: ['setlist', showId],
    queryFn: async () => {
      if (!showId) {
        console.log('No show ID provided');
        return null;
      }

      console.log('Fetching setlist for show:', showId);
      const { data: setlist, error } = await supabase
        .from('setlists')
        .select(`
          *,
          songs:setlist_songs(
            id,
            song_name,
            total_votes,
            suggested,
            spotify_id,
            is_top_track
          )
        `)
        .eq('show_id', showId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching setlist:', error);
        return null;
      }

      if (!setlist && user) {
        console.log('No setlist found, creating new one');
        return createSetlistMutation.mutateAsync({
          showName: '',
          venueId: undefined
        });
      }

      console.log('Found setlist:', setlist);
      return setlist;
    },
    enabled: !!showId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!setlist?.id) return;

    const channel = supabase
      .channel('setlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlist.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['setlist', showId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlist?.id, showId, queryClient]);

  return {
    ...queryResult,
    data: setlist,
    addSong: addSongMutation.mutate
  };
}
