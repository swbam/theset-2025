
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/shows/LoadingState";
import { EmptyState } from "@/components/shows/EmptyState";
import { ShowDetails } from "@/components/shows/ShowDetails";
import { Setlist } from "@/components/shows/Setlist";
import { SongSuggestionDialog } from "@/components/shows/SongSuggestionDialog";
import { getArtistTopTracks, searchArtist } from "@/integrations/spotify/client";
import { createInitialSetlistFromSpotifyTracks } from "@/integrations/ticketmaster/api";
import type { DatabaseSongRecord } from "@/types/setlist";
import { calculateSongVotes } from "@/utils/voteCalculations";

export default function ShowPage() {
  // Extract the event ID from the URL
  const { eventId } = useParams<{ eventId: string }>();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  
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

      // If setlist exists, calculate real vote counts
      if (existingSetlist) {
        try {
          // Calculate real vote counts from user_votes table
          const songsWithRealVotes = await calculateSongVotes(existingSetlist.id);
          
          return {
            id: existingSetlist.id,
            songs: songsWithRealVotes
          };
        } catch (err) {
          console.error('Error calculating real vote counts:', err);
          // Fallback to stored data without real votes
          const songsList = Array.isArray(existingSetlist.songs) 
            ? existingSetlist.songs 
            : [];
            
          return {
            id: existingSetlist.id,
            songs: songsList.map((song: any) => ({
              id: song.id || `song-${Math.random().toString(36).substr(2, 9)}`,
              song_name: song.name || song.song_name || 'Unknown Song',
              total_votes: 0, // Start with 0 since real votes couldn't be calculated
              suggested: song.suggested || false
            }))
          };
        }
      }

      // If no setlist exists, create a new one with real Spotify data
      console.log('Creating new setlist for show:', show?.id);
      
      try {
        // Get artist info
        const artistName = show?.artist?.name || 'Unknown Artist';
        
        // Search for artist on Spotify if we don't have spotify_id
        let artistSpotifyId = show?.artist?.spotify_id;
        if (!artistSpotifyId) {
          const spotifyArtist = await searchArtist(artistName);
          artistSpotifyId = spotifyArtist?.id;
          
          // Update artist with Spotify ID if found
          if (artistSpotifyId && show?.artist?.id) {
            await supabase
              .from('artists')
              .update({ spotify_id: artistSpotifyId })
              .eq('id', show.artist.id);
          }
        }

        if (!artistSpotifyId) {
          console.error('Could not find artist on Spotify:', artistName);
          throw new Error(`Artist "${artistName}" not found on Spotify. Please ensure the artist name is correct.`);
        }

        // Get artist's top tracks from Spotify using Edge Function
        const topTracks = await getArtistTopTracks(artistSpotifyId);
        
        if (!topTracks || topTracks.length === 0) {
          console.error('No top tracks found for artist:', artistName);
          throw new Error(`No songs found for artist "${artistName}" on Spotify.`);
        }

        // Create setlist with real Spotify data
        const setlistId = await createInitialSetlistFromSpotifyTracks(show?.id, topTracks);
        
        // Return the newly created setlist with songs
        return {
          id: setlistId,
          songs: topTracks.map((track, index) => ({
            id: `song-${track.id}`,
            song_name: track.name,
            total_votes: 0,
            suggested: false
          }))
        };

      } catch (error) {
        console.error('Error creating setlist from Spotify:', error);
        throw error; // Propagate error to show proper error state
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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to suggest songs",
        variant: "destructive"
      });
      return;
    }
    setShowSuggestionDialog(true);
  };

  const handleSongAdded = () => {
    // Invalidate queries to refresh the setlist
    queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
  };

  if (showLoading || setlistLoading) {
    return <LoadingState />;
  }

  if (!show) {
    return <EmptyState />;
  }

  const venueInfo = show.venue_name ? {
    name: show.venue_name,
    city: (show.venue_location as any)?.city?.name,
    state: (show.venue_location as any)?.state?.name
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
      
      {setlist?.id && (
        <SongSuggestionDialog
          open={showSuggestionDialog}
          onOpenChange={setShowSuggestionDialog}
          setlistId={setlist.id}
          onSongAdded={handleSongAdded}
        />
      )}
    </div>
  );
}
