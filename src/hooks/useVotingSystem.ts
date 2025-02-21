
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { useEffect } from "react";
import type { VoteCount } from "../types/votes";

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
        .select('*')
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

      if (user) {
        const { data, error } = await supabase
          .from('user_votes')
          .select('song_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user votes:', error);
          return [];
        }

        return data?.map(v => v.song_id) || [];
      } else {
        const { data, error } = await supabase
          .from('anonymous_votes')
          .select('song_id')
          .eq('ip_address', 'anonymous'); // In production, this would be the actual IP

        if (error) {
          console.error('Error fetching anonymous votes:', error);
          return [];
        }

        return data?.map(v => v.song_id) || [];
      }
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
        p_user_id: user?.id,
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
          queryClient.invalidateQueries({ queryKey: ['vote-counts', setlistId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId, queryClient]);

  const getVoteCount = (songId: string): number => {
    const voteData = voteCounts?.find(v => v.song_id === songId);
    return voteData?.total_votes || 0;
  };

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
