
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
      // Try to fetch existing setlist
      const { data: existingSetlist, error: setlistError } = await supabase
        .from('setlists')
        .select(`
          id,
          show_id,
          created_at,
          songs
        `)
        .eq('show_id', show?.id)
        .maybeSingle();
      
      if (setlistError && !setlistError.message.includes('No rows found')) {
        console.error('Error fetching setlist:', setlistError);
        return null;
      }

      // If setlist exists, transform the songs array
      if (existingSetlist) {
        try {
          const songsList = Array.isArray(existingSetlist.songs) 
            ? existingSetlist.songs 
            : [];
            
          return {
            id: existingSetlist.id,
            songs: songsList.map((song: any) => ({
              id: song.id || `song-${Math.random().toString(36).substr(2, 9)}`,
              song_name: song.name || song.song_name || 'Unknown Song',
              total_votes: song.votes || song.total_votes || 0,
              suggested: song.suggested || false
            }))
          };
        } catch (err) {
          console.error('Error parsing setlist songs:', err);
          return {
            id: existingSetlist.id,
            songs: []
          };
        }
      }

      // If no setlist exists, create a new one with default songs
      console.log('Creating new setlist for show:', show?.id);
      
      // For now, return a basic placeholder until we implement song fetching
      return {
        id: 'temp-id',
        songs: [
          { id: 'song-1', song_name: 'Introduction', total_votes: 0, suggested: false },
          { id: 'song-2', song_name: 'Greatest Hit', total_votes: 0, suggested: false },
          { id: 'song-3', song_name: 'Popular Song', total_votes: 0, suggested: false },
          { id: 'song-4', song_name: 'Fan Favorite', total_votes: 0, suggested: false },
          { id: 'song-5', song_name: 'Deep Cut', total_votes: 0, suggested: false }
        ]
      };
    },
    enabled: !!show?.id,
  });

  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlist?.id],
    queryFn: async () => {
      if (!user || !setlist?.id) return [];
      
      try {
        const { data: votes, error } = await supabase
          .from('user_votes')
          .select('song_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching user votes:', error);
          return [];
        }

        return votes?.map(v => v.song_id) || [];
      } catch (err) {
        console.error('Error in userVotes query:', err);
        return [];
      }
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

  const venueInfo = show.venue_name ? {
    name: show.venue_name,
    city: show.venue_location?.city?.name,
    state: show.venue_location?.state?.name
  } : undefined;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <ShowDetails
            name={show.name}
            date={show.date}
            venue={venueInfo}
          />
          <Setlist
            setlist={setlist}
            userVotes={userVotes || []}
            user={user}
            onVote={handleVote}
            onSuggest={handleSuggest}
          />
        </div>
      </div>
    </div>
  );
}
