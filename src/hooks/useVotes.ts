
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export function useVotes(setlistId: string | undefined, user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlistId],
    queryFn: async () => {
      const { data: votes, error } = await supabase
        .from('user_votes')
        .select('song_id')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Error fetching user votes:', error);
        return [];
      }

      return votes?.map(v => v.song_id) || [];
    },
    enabled: !!setlistId && !!user?.id,
  });

  const handleVote = async (songId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote for songs",
        variant: "destructive"
      });
      return;
    }

    // Check rate limiting (60 votes per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentVotes, error: countError } = await supabase
      .from('user_votes')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo.toISOString());

    if (countError) {
      toast({
        title: "Error",
        description: "Failed to check vote limit",
        variant: "destructive"
      });
      return;
    }

    if ((recentVotes?.length || 0) >= 60) {
      toast({
        title: "Rate Limited",
        description: "You've reached the maximum votes allowed per hour",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('user_votes')
      .insert({
        user_id: user.id,
        song_id: songId
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive"
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['user-votes', setlistId] });
    toast({
      title: "Success",
      description: "Your vote has been recorded"
    });
  };

  return {
    userVotes,
    handleVote
  };
}
