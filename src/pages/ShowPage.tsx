
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/shows/LoadingState";
import { EmptyState } from "@/components/shows/EmptyState";
import { ShowDetails } from "@/components/shows/ShowDetails";
import { Setlist } from "@/components/shows/Setlist";

export default function ShowPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
      console.log('Fetching show:', eventId);
      const { data: show, error } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('ticketmaster_id', eventId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      if (!show) {
        console.error('Show not found:', eventId);
        return null;
      }

      return show;
    },
    enabled: !!eventId,
  });

  // Create setlist mutation
  const createSetlistMutation = useMutation({
    mutationFn: async () => {
      if (!show || !user) return null;
      
      const { data: setlist, error } = await supabase
        .from('setlists')
        .insert({
          show_id: show.id,
          name: show.name,
          created_by: user.id,
          venue_id: show.venue?.id,
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
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
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

  const { data: setlist, isLoading: setlistLoading } = useQuery({
    queryKey: ['setlist', show?.id],
    queryFn: async () => {
      console.log('Fetching setlist for show:', show?.id);
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
        .eq('show_id', show?.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching setlist:', error);
        return null;
      }

      // If no setlist exists and user is authenticated, create one
      if (!setlist && user && show) {
        console.log('No setlist found, creating new one');
        createSetlistMutation.mutate();
        return null;
      }

      return setlist;
    },
    enabled: !!show?.id,
  });

  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlist?.id],
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
    enabled: !!setlist?.id && !!user?.id,
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

    queryClient.invalidateQueries({ queryKey: ['user-votes', setlist?.id] });
    toast({
      title: "Success",
      description: "Your vote has been recorded"
    });
  };

  const handleSuggest = () => {
    toast({
      title: "Coming Soon",
      description: "Song suggestions will be available soon!"
    });
  };

  if (showLoading || setlistLoading) {
    return <LoadingState />;
  }

  if (!show) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <ShowDetails
            name={show.name}
            date={show.date}
            venue={show.venue}
          />
          <Setlist
            setlist={setlist}
            userVotes={userVotes}
            user={user}
            onVote={handleVote}
            onSuggest={handleSuggest}
          />
        </div>
      </div>
    </div>
  );
}
