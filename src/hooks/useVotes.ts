
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export function useVotes(setlistId: string | undefined, user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlistId, user?.id],
    queryFn: async () => {
      if (user) {
        // Get authenticated user votes
        const { data: votes, error } = await supabase
          .from('user_votes')
          .select('song_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching user votes:', error);
          return [];
        }
        return votes?.map(v => v.song_id) || [];
      } else {
        // Get anonymous votes based on IP
        const { data: votes, error } = await supabase
          .from('anonymous_votes')
          .select('song_id, ip_address');
        
        if (error) {
          console.error('Error fetching anonymous votes:', error);
          return [];
        }
        return votes?.map(v => v.song_id) || [];
      }
    },
    enabled: !!setlistId,
  });

  const handleVote = async (songId: string) => {
    if (user) {
      // Handle authenticated user vote
      const { error } = await supabase
        .from('user_votes')
        .insert({
          user_id: user.id,
          song_id: songId
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Voted",
            description: "You've already voted for this song",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to submit vote",
            variant: "destructive"
          });
        }
        return;
      }
    } else {
      // Handle anonymous vote
      if (userVotes && userVotes.length > 0) {
        toast({
          title: "Sign in required",
          description: "Please sign in to vote for more songs",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('anonymous_votes')
        .insert({
          song_id: songId,
          ip_address: 'anonymous' // This will be replaced by the actual IP in RLS
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Voted",
            description: "You've already voted for this song from this device",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to submit vote",
            variant: "destructive"
          });
        }
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['user-votes', setlistId] });
    queryClient.invalidateQueries({ queryKey: ['setlist', setlistId] });
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
