import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shows/LoadingState';
import { EmptyState } from '@/components/shows/EmptyState';
import { ShowDetails } from '@/components/shows/ShowDetails';
import { Setlist } from '@/components/shows/Setlist';
import { SongSuggestionDialog } from '@/components/shows/SongSuggestionDialog';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import {
  getArtistTopTracks,
  searchArtist,
} from '@/integrations/spotify/client';
import { createInitialSetlistFromSpotifyTracks } from '@/integrations/ticketmaster/api';
import type { DatabaseSongRecord, StoredSetlistSong } from '@/types/setlist';
import type { VenueLocation } from '@/types/show';
import { calculateSongVotes } from '@/utils/voteCalculations';

export default function ShowPage() {
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
        .select(
          `
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
        `
        )
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
      const { data: existingSetlist, error: setlistError } = await supabase
        .from('setlists')
        .select(
          `
          id,
          show_id,
          created_at,
          songs
        `
        )
        .eq('show_id', show?.id)
        .maybeSingle();

      if (setlistError && !setlistError.message.includes('No rows found')) {
        console.error('Error fetching setlist:', setlistError);
        return null;
      }

      if (existingSetlist) {
        try {
          const songsWithRealVotes = await calculateSongVotes(
            existingSetlist.id
          );

          return {
            id: existingSetlist.id,
            songs: songsWithRealVotes,
          };
        } catch (err) {
          console.error('Error calculating real vote counts:', err);
          const songsList = Array.isArray(existingSetlist.songs)
            ? existingSetlist.songs
            : [];

          return {
            id: existingSetlist.id,
            songs: songsList.map((song) => {
              const typedSong = song as unknown as StoredSetlistSong;
              return {
                id: typedSong.id || `song-${Math.random().toString(36).substr(2, 9)}`,
                song_name: typedSong.name || typedSong.song_name || 'Unknown Song',
                total_votes: 0,
                suggested: typedSong.suggested || false,
              };
            }),
          };
        }
      }

      console.log('Creating new setlist for show:', show?.id);

      try {
        const artistName = show?.artist?.name || 'Unknown Artist';

        let artistSpotifyId = show?.artist?.spotify_id;
        if (!artistSpotifyId) {
          const spotifyArtist = await searchArtist(artistName);
          artistSpotifyId = spotifyArtist?.id;

          if (artistSpotifyId && show?.artist?.id) {
            await supabase
              .from('artists')
              .update({ spotify_id: artistSpotifyId })
              .eq('id', show.artist.id);
          }
        }

        if (!artistSpotifyId) {
          console.error('Could not find artist on Spotify:', artistName);
          throw new Error(
            `Artist "${artistName}" not found on Spotify. Please ensure the artist name is correct.`
          );
        }

        const topTracks = await getArtistTopTracks(artistSpotifyId);

        if (!topTracks || topTracks.length === 0) {
          console.error('No top tracks found for artist:', artistName);
          throw new Error(
            `No songs found for artist "${artistName}" on Spotify.`
          );
        }

        const setlistId = await createInitialSetlistFromSpotifyTracks(
          show?.id,
          topTracks
        );

        return {
          id: setlistId,
          songs: topTracks.map((track, index) => ({
            id: `song-${track.id}`,
            song_name: track.name,
            total_votes: 0,
            suggested: false,
          })),
        };
      } catch (error) {
        console.error('Error creating setlist from Spotify:', error);
        throw error;
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

        return votes?.map((v) => v.song_id) || [];
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
        title: 'Login Required',
        description: 'Please log in to vote for songs',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('user_votes').insert({
        user_id: user.id,
        song_id: songId,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Voted',
            description: 'You have already voted for this song',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to submit vote',
            variant: 'destructive',
          });
        }
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', setlist?.id] });

      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded',
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  const handleSuggest = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to suggest songs',
        variant: 'destructive',
      });
      return;
    }
    setShowSuggestionDialog(true);
  };

  const handleSongAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
  };

  if (showLoading || setlistLoading) {
    return <LoadingState />;
  }

  if (!show) {
    return <EmptyState />;
  }

  const venueInfo = show.venue_name
    ? {
        name: show.venue_name,
        city: (show.venue_location as VenueLocation)?.city?.name,
        state: (show.venue_location as VenueLocation)?.state?.name,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <ShowDetails name={show.name} date={show.date} venue={venueInfo} />
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
      <Footer />
    </div>
  );
}
