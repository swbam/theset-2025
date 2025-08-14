import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shows/LoadingState';
import { SongSuggestionDialog } from '@/components/shows/SongSuggestionDialog';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { useGuestActions } from '@/hooks/useGuestActions';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { Helmet } from 'react-helmet-async';
import { ThumbsUp, Plus, Music, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ShowPage() {
  const { showSlug } = useParams<{ showSlug: string }>();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id') || showSlug;
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const { guestActionsUsed, incrementGuestActions } = useGuestActions();

  // Fetch show data
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
      console.log('Fetching show data for:', eventId);
      
      const { data: showRow, error } = await supabase
        .from('cached_shows')
        .select(`
          *,
          artists:artist_id (
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

      if (!showRow) {
        console.log('Show not found in cache, searching...');
        return null;
      }

      // Get the canonical shows table row for setlist operations
      const { data: showCore } = await supabase
        .from('shows')
        .select('id')
        .eq('ticketmaster_id', showRow.ticketmaster_id)
        .maybeSingle();

      return { 
        ...showRow, 
        dbShowId: showCore?.id,
        artist: showRow.artists
      };
    },
    enabled: !!eventId,
  });

  // Set up real-time updates
  useRealTimeUpdates(['setlist_songs', 'song_votes'], () => {
    if (show?.dbShowId) {
      queryClient.invalidateQueries({ queryKey: ['setlist', show.dbShowId] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', show.dbShowId, user?.id] });
    }
  });

  // Fetch or create setlist
  const { data: setlist, isLoading: setlistLoading } = useQuery({
    queryKey: ['setlist', show?.dbShowId],
    queryFn: async () => {
      const showId = show?.dbShowId;
      if (!showId) return null;

      console.log('Looking for setlist for show:', showId);

      // Check for existing setlist
      const { data: existingSetlist } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)
        .maybeSingle();

      if (existingSetlist) {
        console.log('Found existing setlist:', existingSetlist.id);
        
        const { data: songsData } = await supabase
          .rpc('get_setlist_with_votes', { setlist_uuid: existingSetlist.id });

        return {
          id: existingSetlist.id,
          songs: songsData || []
        };
      }

      // Create new setlist if artist exists
      const artist = show.artist;
      if (!artist?.name) {
        console.log('No artist data available');
        return null;
      }

      console.log('Creating new setlist for artist:', artist.name);

      try {
        // Initialize setlist using artist name
        const { data: newSetlistId, error: initError } = await supabase.rpc('initialize_show_setlist', {
          p_show_id: showId,
          p_artist_name: artist.name
        });
        
        if (initError) {
          console.error('Failed to initialize setlist:', initError);
          return null;
        }
        
        // Get the complete setlist with songs
        const { data: songsData } = await supabase
          .rpc('get_setlist_with_votes', { setlist_uuid: newSetlistId });

        console.log('Created setlist with songs:', songsData?.length || 0);

        return {
          id: newSetlistId,
          songs: songsData || []
        };
      } catch (error) {
        console.error('Failed to create setlist:', error);
        return null;
      }
    },
    enabled: !!show?.dbShowId,
  });

  // Get user votes for this setlist
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlist?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !setlist?.songs?.length) return [];

      const songIds = setlist.songs.map((s: any) => s.id);

      const { data: votes } = await supabase
        .from('song_votes')
        .select('setlist_song_id')
        .eq('user_id', user.id)
        .in('setlist_song_id', songIds);

      return votes?.map((v: any) => v.setlist_song_id) || [];
    },
    enabled: !!user?.id && !!setlist?.songs?.length,
  });

  const handleVote = async (songId: string) => {
    try {
      if (!user?.id) {
        if (guestActionsUsed >= 1) {
          toast({
            title: 'Sign in Required',
            description: 'Please sign in to vote on more songs.',
            variant: 'destructive',
          });
          return;
        }
        incrementGuestActions();
      }

      const { data: result, error } = await supabase.rpc('cast_song_vote', {
        p_setlist_song_id: songId,
        p_user_id: user?.id || null,
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

      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded',
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.dbShowId] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', setlist?.id, user?.id] });

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
    queryClient.invalidateQueries({ queryKey: ['setlist', show?.dbShowId] });
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
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
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

  const totalVotes = setlist?.songs?.reduce((sum: number, song: any) => sum + (song.total_votes || 0), 0) || 0;
  const sortedSongs = setlist?.songs?.sort((a: any, b: any) => (b.total_votes || 0) - (a.total_votes || 0)) || [];

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      <Helmet>
        <title>{`${show.name} — Vote on the setlist | TheSet`}</title>
        <meta name="description" content={`Vote on the setlist for ${show.name}${show.venue_name ? ' at ' + show.venue_name : ''}.`} />
        <link rel="canonical" href={`${window.location.origin}${location.pathname}`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Show Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {show.artist?.image_url && (
              <img
                src={show.artist.image_url}
                alt={show.artist.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{show.artist?.name || 'Artist'}</h1>
              <h2 className="text-2xl text-white/90 mb-2">{show.name}</h2>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(show.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {new Date(show.date).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                {venueInfo && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{venueInfo.name}{venueInfo.city && venueInfo.state && `, ${venueInfo.city}, ${venueInfo.state}`}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {show.ticket_url && (
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <a href={show.ticket_url} target="_blank" rel="noopener noreferrer">
                Get Tickets
              </a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Setlist Section */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">What do you want to hear?</h3>
                  <p className="text-zinc-400">Vote for songs you want to hear at this show</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5" />
                    <span>{totalVotes} votes</span>
                  </div>
                  <Button
                    onClick={handleSuggest}
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Suggest Song
                  </Button>
                </div>
              </div>

              {/* Songs List */}
              <div className="space-y-3">
                {sortedSongs.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 mx-auto text-zinc-500 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No songs yet</h3>
                    <p className="text-zinc-400 mb-4">Be the first to suggest a song for this setlist!</p>
                    <Button onClick={handleSuggest} className="bg-green-500 hover:bg-green-600 text-black">
                      <Plus className="w-4 h-4 mr-2" />
                      Suggest the First Song
                    </Button>
                  </div>
                ) : (
                  sortedSongs.map((song: any, index: number) => {
                    const hasVoted = userVotes?.includes(song.id);
                    const rank = index + 1;
                    
                    return (
                      <div
                        key={song.id}
                        className={`
                          bg-gray-900 border border-gray-800 rounded-lg p-4 
                          hover:bg-gray-800 transition-all duration-200
                          ${hasVoted ? 'ring-1 ring-green-500' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                ${rank <= 3 ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}
                              `}>
                                {rank}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-white truncate">
                                  {song.song_name}
                                </h3>
                                {song.suggested && (
                                  <Badge variant="secondary" className="text-xs">
                                    Fan Suggested
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {song.total_votes || 0} {(song.total_votes || 0) === 1 ? 'vote' : 'votes'}
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleVote(song.id)}
                            disabled={hasVoted}
                            variant={hasVoted ? 'secondary' : 'outline'}
                            size="sm"
                            className={`
                              flex-shrink-0
                              ${hasVoted 
                                ? 'bg-green-500 text-black hover:bg-green-600' 
                                : 'border-gray-600 text-white hover:bg-gray-800'
                              }
                            `}
                          >
                            <ThumbsUp className={`w-4 h-4 mr-1 ${hasVoted ? 'fill-current' : ''}`} />
                            {hasVoted ? 'Voted' : 'Vote'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!user && guestActionsUsed > 0 && (
                <div className="mt-6 bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm">
                    You've used your guest voting action. Sign in to vote for more songs and track your activity!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Voting Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold">Voting Stats</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-zinc-400 text-sm mb-1">Total Votes</div>
                  <div className="text-white text-3xl font-bold">{totalVotes}</div>
                </div>
                
                <div>
                  <div className="text-zinc-400 text-sm mb-1">Songs in Setlist</div>
                  <div className="text-white text-2xl font-bold">{sortedSongs.length}</div>
                </div>
                
                <div className="flex items-center gap-2 text-zinc-400">
                  <Music className="w-4 h-4" />
                  <span>Live voting in progress</span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-zinc-900/50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <h3 className="text-white font-bold">How It Works</h3>
              </div>
              
              <div className="space-y-4 text-sm text-zinc-300">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">1</div>
                  <p>Vote for songs you want to hear at this show. The most voted songs rise to the top.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">2</div>
                  <p>Anyone can suggest new songs to add to the setlist using the "Suggest Song" button.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">3</div>
                  <p>Guest users can vote once. Create an account to vote unlimited times!</p>
                </div>
              </div>
            </div>
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
          onGuestActionUsed={incrementGuestActions}
        />
      )}
      
      <Footer />
    </div>
  );
}