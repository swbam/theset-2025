import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { useEffect } from "react";

interface VoteCount {
  song_id: string;
  vote_count: number;
}

export function useVotingSystem(setlistId: string | undefined, user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get vote counts from materialized view
  const { data: voteCounts } = useQuery<VoteCount[]>({
    queryKey: ['vote-counts', setlistId],
    queryFn: async () => {
      if (!setlistId) return [];

      const { data, error } = await supabase
        .from('song_vote_counts')
        .select('song_id, vote_count')
        .eq('setlist_id', setlistId);

      if (error) {
        console.error('Error fetching vote counts:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!setlistId
  });

  // Get user's votes
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlistId, user?.id],
    queryFn: async () => {
      if (!setlistId) return [];

      const { data, error } = await supabase
        .from('vote_logs')
        .select('song_id')
        .eq(user ? 'user_id' : 'ip_address', user?.id || 'anonymous');

      if (error) {
        console.error('Error fetching user votes:', error);
        return [];
      }

      return data?.map(v => v.song_id) || [];
    },
    enabled: !!setlistId
  });

  // Cast vote mutation
  const voteMutation = useMutation({
    mutationFn: async (songId: string) => {
      if (!user && userVotes && userVotes.length > 0) {
        throw new Error('Please sign in to vote for more songs');
      }

      const { error } = await supabase.rpc('cast_vote', {
        p_song_id: songId,
        p_user_id: user?.id || null,
        p_ip_address: user ? null : 'anonymous' // In production, this would be the actual IP
      });

      if (error) {
        if (error.message.includes('Rate limit exceeded')) {
          throw new Error('You\'ve reached the voting limit. Please try again later.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['vote-counts', setlistId] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', setlistId] });
      
      toast({
        title: "Success",
        description: "Your vote has been recorded"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Set up real-time subscription for vote counts
  useEffect(() => {
    if (!setlistId) return;

    const channel = supabase
      .channel('vote-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'song_vote_counts',
          filter: `setlist_id=eq.${setlistId}`
        },
        () => {
          // Invalidate vote counts query when changes occur
          queryClient.invalidateQueries({ queryKey: ['vote-counts', setlistId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId, queryClient]);

  // Helper function to get vote count for a song
  const getVoteCount = (songId: string): number => {
    const voteData = voteCounts?.find(v => v.song_id === songId);
    return voteData?.vote_count || 0;
  };

  // Helper function to check if user has voted for a song
  const hasVoted = (songId: string): boolean => {
    return userVotes?.includes(songId) || false;
  };

  return {
    voteCounts,
    userVotes,
    castVote: voteMutation.mutate,
    isVoting: voteMutation.isPending,
    getVoteCount,
    hasVoted,
    isLoading: voteMutation.isPending
  };
}
