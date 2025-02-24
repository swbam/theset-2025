
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/shows/LoadingState";
import { EmptyState } from "@/components/shows/EmptyState";
import { ShowDetails } from "@/components/shows/ShowDetails";
import { Setlist } from "@/components/shows/Setlist";

export default function ShowPage() {
  // Extract the event ID from the URL
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
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

  const { data: setlist, isLoading: setlistLoading } = useQuery({
    queryKey: ['setlist', show?.id],
    queryFn: async () => {
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

    toast({
      title: "Vote Submitted",
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
