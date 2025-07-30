import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shows/LoadingState';
import { ShowDetails } from '@/components/shows/ShowDetails';
import { Setlist } from '@/components/shows/Setlist';
import { SongSuggestionDialog } from '@/components/shows/SongSuggestionDialog';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { useGuestActions } from '@/hooks/useGuestActions';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

export default function ShowPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const { guestActionsUsed, incrementGuestActions } = useGuestActions();

  // Set up real-time updates for setlist changes
  useRealTimeUpdates(['setlist_songs', 'votes'], () => {
    if (show?.id) {
      queryClient.invalidateQueries({ queryKey: ['setlist', show.id] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', show.id, user?.id] });
    }
  });

  // Fetch show data
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
      const { data: show, error } = await supabase
        .from('cached_shows')
        .select(`
          *,
          artists!cached_shows_artist_id_fkey(
            id,
            name,
            spotify_id,
            image_url
          )
        `)
        .eq('ticketmaster_id', eventId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      return show;
    },
    enabled: !!eventId,
  });

  // Fetch or create setlist
  const { data: setlist, isLoading: setlistLoading } = useQuery({
    queryKey: ['setlist', show?.id],
    queryFn: async () => {
      if (!show?.id) return null;

      // Check for existing setlist
      const { data: existingSetlist } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', show.id)
        .maybeSingle();

      if (existingSetlist) {
        // Get setlist songs with vote counts
        const { data: songsData } = await supabase
          .rpc('get_setlist_with_votes', { setlist_uuid: existingSetlist.id });

        return {
          id: existingSetlist.id,
          songs: songsData || []
        };
      }

      // Create new setlist if artist has Spotify ID
      const artist = show.artists;
      if (artist?.spotify_id) {
        // Get top tracks from Spotify via Edge Function
        try {
          const { data: spotifyData } = await supabase.functions.invoke('spotify', {
            body: {
              action: 'getArtistTopTracks',
              params: { artistId: artist.spotify_id }
            }
          });
          
          if (spotifyData?.tracks && spotifyData.tracks.length > 0) {
            // Initialize setlist with Spotify tracks
            const { data: newSetlistId } = await supabase.rpc('initialize_show_setlist', {
              p_show_id: show.id,
              p_spotify_tracks: spotifyData.tracks
            });
            
            // Get the complete setlist with songs
            const { data: songsData } = await supabase
              .rpc('get_setlist_with_votes', { setlist_uuid: newSetlistId });

            return {
              id: newSetlistId,
              songs: songsData || []
            };
          }
        } catch (error) {
          console.error('Failed to initialize setlist:', error);
        }
      }

      return null;
    },
    enabled: !!show?.id,
  });

  // Get user votes for this setlist
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', show?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !show?.id) return [];

      const { data: votes } = await supabase
        .from('votes')
        .select('song_id')
        .eq('user_id', user.id)
        .eq('show_id', show.id);

      return votes?.map(v => v.song_id) || [];
    },
    enabled: !!user?.id && !!show?.id,
  });

  const handleVote = async (songId: string) => {
    try {
      const clientIP = !user ? await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown') : null;
      
      const { data: result, error } = await supabase
        .rpc('cast_setlist_vote', {
          p_setlist_song_id: songId,
          p_user_id: user?.id || null,
          p_ip_address: clientIP
        });

      if (error) {
        throw error;
      }

      if (!result) {
        toast({
          title: 'Already Voted',
          description: 'You have already voted for this song',
          variant: 'destructive',
        });
        return;
      }

      if (!user) {
        incrementGuestActions();
        toast({
          title: 'Guest Vote Recorded',
          description: 'Sign in to vote for more songs and track your activity',
        });
      } else {
        toast({
          title: 'Vote Submitted',
          description: 'Your vote has been recorded',
        });
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', show?.id, user?.id] });

    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  const handleSuggest = () => {
    if (!user && guestActionsUsed >= 1) {
      toast({
        title: 'Sign in Required',
        description: 'Please sign in to suggest songs',
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
    return (
      <div className="min-h-screen bg-black">
        <TopNavigation />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <p className="text-zinc-400 mb-6">The show you're looking for doesn't exist or hasn't been synced yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-primary text-black px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const venueInfo = show.venue_name
    ? {
        name: show.venue_name,
        city: (show.venue_location as any)?.city?.name,
        state: (show.venue_location as any)?.state?.name,
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
            userVotes={userVotes}
            user={user}
            onVote={handleVote}
            onSuggest={handleSuggest}
            isAuthenticated={!!user}
            guestActionsUsed={guestActionsUsed}
          />
        </div>
      </div>

      {setlist?.id && (
        <SongSuggestionDialog
          open={showSuggestionDialog}
          onOpenChange={setShowSuggestionDialog}
          setlistId={setlist.id}
          onSongAdded={handleSongAdded}
          isAuthenticated={!!user}
          guestActionsUsed={guestActionsUsed}
          onGuestActionUsed={incrementGuestActions}
        />
      )}
      <Footer />
    </div>
  );
}