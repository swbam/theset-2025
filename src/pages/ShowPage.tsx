
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/shows/LoadingState";
import { EmptyState } from "@/components/shows/EmptyState";
import { ShowDetails } from "@/components/shows/ShowDetails";
import { Setlist } from "@/components/shows/Setlist";
import { getArtistTopTracks, searchArtist } from "@/integrations/spotify/client";
import { createInitialSetlistFromSpotifyTracks } from "@/integrations/ticketmaster/api";

export default function ShowPage() {
  // Extract the event ID from the URL
  const { eventId } = useParams<{ eventId: string }>();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
          ),
          artist:artists(
            id,
            name,
            spotify_id
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

      // If no setlist exists, create a new one with real Spotify data
      console.log('Creating new setlist for show:', show?.id);
      
      try {
        // Get artist info and Spotify access token
        const artistName = show?.artist?.name || 'Unknown Artist';
        const spotifyToken = session?.provider_token;
        
        if (!spotifyToken) {
          console.error('No Spotify access token available');
          return {
            id: 'temp-id',
            songs: []
          };
        }

        // Search for artist on Spotify if we don't have spotify_id
        let artistSpotifyId = show?.artist?.spotify_id;
        if (!artistSpotifyId) {
          const spotifyArtist = await searchArtist(spotifyToken, artistName);
          artistSpotifyId = spotifyArtist?.id;
        }

        if (!artistSpotifyId) {
          console.error('Could not find artist on Spotify:', artistName);
          return {
            id: 'temp-id',
            songs: []
          };
        }

        // Get artist's top tracks from Spotify
        const topTracks = await getArtistTopTracks(spotifyToken, artistSpotifyId);
        
        if (topTracks.length === 0) {
          console.error('No top tracks found for artist:', artistName);
          return {
            id: 'temp-id',
            songs: []
          };
        }

        // Create setlist with real Spotify data
        const newSetlist = await createInitialSetlistFromSpotifyTracks(
          show?.id,
          show?.artist_id,
          topTracks
        );

        if (newSetlist) {
          return {
            id: newSetlist.id,
            songs: newSetlist.songs || []
          };
        }
        
        return {
          id: 'temp-id',
          songs: []
        };
      } catch (error) {
        console.error('Error creating setlist with Spotify data:', error);
        return {
          id: 'temp-id',
          songs: []
        };
      }
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

    try {
      const { error } = await supabase
        .from('user_votes')
        .insert({
          user_id: user.id,
          song_id: songId
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Voted",
            description: "You have already voted for this song",
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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', setlist?.id] });

      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded"
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive"
      });
    }
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
