
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import type { Artist } from "@/integrations/ticketmaster/types";

export const useArtistFollow = (artist: Artist | null, user: User | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isFollowing } = useQuery({
    queryKey: ['following', artist?.id],
    queryFn: async () => {
      if (!user || !artist) return false;
      const { data } = await supabase
        .from('user_artists')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', artist.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!artist,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !artist) throw new Error('Not authenticated or no artist');
      const { error } = await supabase
        .from('user_artists')
        .insert({
          user_id: user.id,
          artist_id: artist.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', artist?.id] });
      queryClient.invalidateQueries({ queryKey: ['followedArtists'] });
      toast({
        title: "Success",
        description: `You are now following ${artist?.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow artist. Please try again.",
        variant: "destructive",
      });
      console.error('Follow error:', error);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !artist) throw new Error('Not authenticated or no artist');
      const { error } = await supabase
        .from('user_artists')
        .delete()
        .eq('user_id', user.id)
        .eq('artist_id', artist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', artist?.id] });
      queryClient.invalidateQueries({ queryKey: ['followedArtists'] });
      toast({
        title: "Success",
        description: `You have unfollowed ${artist?.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unfollow artist. Please try again.",
        variant: "destructive",
      });
      console.error('Unfollow error:', error);
    },
  });

  const handleFollowClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow artists",
        variant: "destructive",
      });
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    isFollowActionPending: followMutation.isPending || unfollowMutation.isPending,
    handleFollowClick
  };
};
