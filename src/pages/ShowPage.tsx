import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shows/LoadingState';
import { EmptyState } from '@/components/shows/EmptyState';
import { ShowDetails } from '@/components/shows/ShowDetails';
import { SongSuggestionDialog } from '@/components/shows/SongSuggestionDialog';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { getArtistTopTracks, searchArtist } from '@/integrations/spotify/client';
import { realtimeVoting } from '@/services/realtimeVoting';

export default function ShowPage() {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [guestActionsUsed, setGuestActionsUsed] = useState(0);

  // Fetch show data
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', showId],
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
        .eq('ticketmaster_id', showId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      return show;
    },
    enabled: !!showId,
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
      if (!artist?.spotify_id) {
        // Try to find artist on Spotify
        const spotifyArtist = await searchArtist(artist?.name || 'Unknown');
        if (spotifyArtist && artist?.id) {
          await supabase
            .from('artists')
            .update({ spotify_id: spotifyArtist.id })
            .eq('id', artist.id);
          
          artist.spotify_id = spotifyArtist.id;
        }
      }

      if (artist?.spotify_id) {
        // Get top tracks from Spotify
        const topTracks = await getArtistTopTracks(artist.spotify_id);
        
        if (topTracks.length > 0) {
          // Create setlist
          const { data: newSetlist, error: setlistError } = await supabase
            .from('setlists')
            .insert({ show_id: show.id })
            .select('id')
            .single();

          if (setlistError) {
            throw new Error('Failed to create setlist');
          }

          // Add songs to setlist
          const setlistSongs = topTracks.slice(0, 10).map((track, index) => ({
            setlist_id: newSetlist.id,
            song_name: track.name,
            spotify_id: track.id,
            artist_id: artist.id,
            order_index: index,
            suggested: false
          }));

          const { error: songsError } = await supabase
            .from('setlist_songs')
            .insert(setlistSongs);

          if (songsError) {
            throw new Error('Failed to add songs to setlist');
          }

          return {
            id: newSetlist.id,
            songs: setlistSongs.map(song => ({
              id: song.setlist_id, // This will be replaced with actual ID
              song_name: song.song_name,
              spotify_id: song.spotify_id,
              total_votes: 0,
              suggested: false,
              order_index: song.order_index
            }))
          };
        }
      }

      return null;
    },
    enabled: !!show?.id,
  });

  // Get user votes for this setlist
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlist?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !setlist?.id) return [];

      const { data: votes } = await supabase
        .from('song_votes')
        .select('setlist_song_id')
        .eq('user_id', user.id)
        .in('setlist_song_id', setlist.songs?.map(s => s.id) || []);

      return votes?.map(v => v.setlist_song_id) || [];
    },
    enabled: !!user?.id && !!setlist?.id && !!setlist?.songs?.length,
  });

  // Set up real-time voting updates
  useEffect(() => {
    if (!setlist?.id) return;

    // Subscribe to voting updates
    const subscription = realtimeVoting.subscribeToVoting(
      setlist.id,
      (payload) => {
        // Refresh the setlist data when votes change
        queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
        queryClient.invalidateQueries({ queryKey: ['user-votes', setlist.id, user?.id] });
      }
    );

    // Subscribe to setlist changes (new songs added)
    const setlistSubscription = realtimeVoting.subscribeToSetlistChanges(
      setlist.id,
      (payload) => {
        // Refresh the setlist when songs are added
        queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
      }
    );

    return () => {
      realtimeVoting.unsubscribe();
      if (setlistSubscription) {
        supabase.removeChannel(setlistSubscription);
      }
    };
  }, [setlist?.id, show?.id, user?.id, queryClient]);

  const handleVote = async (songId: string) => {
    if (!user) {
      if (guestActionsUsed >= 1) {
        toast({
          title: 'Sign in Required',
          description: 'Please sign in to vote for more songs',
          variant: 'destructive',
        });
        return;
      }
      setGuestActionsUsed(prev => prev + 1);
      toast({
        title: 'Guest Vote Recorded',
        description: 'Sign in to vote for more songs and track your activity',
      });
      return;
    }

    try {
      const { data: result, error } = await supabase
        .rpc('cast_song_vote', {
          p_setlist_song_id: songId,
          p_user_id: user.id
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

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', setlist?.id, user.id] });

      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded',
      });
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
          
          {/* Setlist Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Setlist</h2>
              {(user || guestActionsUsed === 0) && (
                <Button
                  variant="outline"
                  onClick={handleSuggest}
                  className="hover:bg-white/10 hover:text-white"
                >
                  {!user && guestActionsUsed === 0 ? 'Suggest a song (guest)' : 'Suggest a song'}
                </Button>
              )}
            </div>

            {setlist && setlist.songs ? (
              <div className="space-y-2">
                {setlist.songs.map((song: any) => (
                  <div key={song.id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="space-y-1">
                      <p className="text-white font-medium">{song.song_name}</p>
                      {song.suggested && (
                        <span className="text-sm text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                          Fan suggestion
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 min-w-[2rem] text-right">
                        {song.total_votes || 0}
                      </span>
                      <Button
                        variant="outline"
                        size={!user && guestActionsUsed > 0 ? "sm" : "icon"}
                        onClick={() => handleVote(song.id)}
                        disabled={userVotes?.includes(song.id) || (!user && guestActionsUsed > 0)}
                        className={`${
                          userVotes?.includes(song.id)
                            ? 'bg-white/10 text-white' 
                            : (!user && guestActionsUsed > 0)
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {!user && guestActionsUsed > 0 ? (
                          'Sign in to vote'
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60 py-8 text-center space-y-2">
                <p>The setlist for this show will be available soon.</p>
                {user && (
                  <Button
                    variant="outline"
                    onClick={handleSuggest}
                    className="mt-4 hover:bg-white/10 hover:text-white"
                  >
                    Suggest a song
                  </Button>
                )}
              </div>
            )}
          </div>
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
          onGuestActionUsed={() => setGuestActionsUsed(prev => prev + 1)}
        />
      )}
      <Footer />
    </div>
  );
}