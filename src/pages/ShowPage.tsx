import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddSongDialog } from '@/components/setlist/AddSongDialog';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/shows/LoadingState';
import { SongSuggestionDialog } from '@/components/shows/SongSuggestionDialog';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { useGuestActions } from '@/hooks/useGuestActions';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

export default function ShowPage() {
  const { showSlug } = useParams<{ showSlug: string }>();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id') || showSlug; // fallback to slug if no ID provided
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const { guestActionsUsed, incrementGuestActions } = useGuestActions();

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

  // Set up real-time updates for setlist changes
  useRealTimeUpdates(['setlist_songs', 'song_votes'], () => {
    if (show?.id) {
      queryClient.invalidateQueries({ queryKey: ['setlist', show.id] });
      queryClient.invalidateQueries({ queryKey: ['user-votes', show.id, user?.id] });
    }
  });

  // Fetch or create setlist
  const { data: setlist, isLoading: setlistLoading } = useQuery({
    queryKey: ['setlist', show?.id],
    queryFn: async () => {
      if (!show?.id) {
        console.log('Setlist query: No show ID');
        return null;
      }

      console.log('Setlist query: Looking for setlist for show:', show.id);

      // Check for existing setlist
      const { data: existingSetlist } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', show.id)
        .maybeSingle();

      console.log('Setlist query: Existing setlist:', existingSetlist);

      if (existingSetlist) {
        // Get setlist songs with vote counts
        console.log('Setlist query: Getting songs for existing setlist:', existingSetlist.id);
        const { data: songsData } = await supabase
          .rpc('get_setlist_with_votes', { setlist_uuid: existingSetlist.id });

        console.log('Setlist query: Songs data:', songsData);

        return {
          id: existingSetlist.id,
          songs: songsData || []
        };
      }

      // Create new setlist if artist has Spotify ID
      const artist = show.artists;
      console.log('Setlist query: Artist data:', artist);
      
      if (artist?.spotify_id) {
        console.log('Setlist query: Artist has Spotify ID, creating setlist for:', artist.spotify_id);
        
        // Get top tracks from Spotify via Edge Function
        try {
          console.log('Setlist query: Calling Spotify function...');
          const { data: spotifyData, error: spotifyError } = await supabase.functions.invoke('spotify', {
            body: {
              action: 'getArtistTopTracks',
              params: { artistId: artist.spotify_id }
            }
          });
          
          console.log('Setlist query: Spotify response:', spotifyData, 'Error:', spotifyError);
          
          if (spotifyError) {
            console.error('Setlist query: Spotify error:', spotifyError);
            return null;
          }
          
          if (spotifyData?.data && spotifyData.data.length > 0) {
            console.log('Setlist query: Got Spotify tracks, initializing setlist...');
            
            // Initialize setlist with Spotify tracks
            const { data: newSetlistId, error: initError } = await supabase.rpc('initialize_show_setlist', {
              p_show_id: show.id,
              p_spotify_tracks: spotifyData.data
            });
            
            console.log('Setlist query: Initialize result:', newSetlistId, 'Error:', initError);
            
            if (initError) {
              console.error('Setlist query: Initialize error:', initError);
              return null;
            }
            
            // Get the complete setlist with songs
            const { data: songsData } = await supabase
              .rpc('get_setlist_with_votes', { setlist_uuid: newSetlistId });

            console.log('Setlist query: Final songs data:', songsData);

            return {
              id: newSetlistId,
              songs: songsData || []
            };
          } else {
            console.log('Setlist query: No Spotify tracks found');
          }
        } catch (error) {
          console.error('Setlist query: Failed to initialize setlist:', error);
        }
      } else {
        console.log('Setlist query: No Spotify ID for artist');
      }

      return null;
    },
    enabled: !!show?.id,
  });

  // Get user votes for this setlist (normalized via song_votes)
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlist?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !setlist?.id) return [];

      // Get setlist song ids
      const { data: setlistSongs, error: songsError } = await supabase
        .from('setlist_songs')
        .select('id')
        .eq('setlist_id', setlist.id);

      if (songsError || !setlistSongs || setlistSongs.length === 0) return [];

      const songIds = setlistSongs.map((s: any) => s.id);

      // Get user's votes among those songs
      const { data: votes, error: votesError } = await supabase
        .from('song_votes')
        .select('setlist_song_id')
        .eq('user_id', user.id)
        .in('setlist_song_id', songIds);

      if (votesError) return [];
      return votes?.map((v: any) => v.setlist_song_id) || [];
    },
    enabled: !!user?.id && !!setlist?.id,
  });

  // Query artist's song catalog for the dropdown
  const { data: artistSongs = [] } = useQuery({
    queryKey: ['artist-songs', show?.artist_id],
    queryFn: async () => {
      if (!show?.artist_id) return [];

      const { data, error } = await supabase
        .from('cached_songs')
        .select('id, name, spotify_id')
        .eq('artist_id', show.artist_id)
        .order('name');

      if (error) {
        console.error('Error fetching artist songs:', error);
        return [];
      }

      console.log('Artist songs fetched:', data?.length || 0, 'songs');
      return data || [];
    },
    enabled: !!show?.artist_id,
  });

  const handleVote = async (songId: string) => {
    try {
      if (!user?.id) {
        toast({
          title: 'Sign in Required',
          description: 'Please sign in to vote on songs.',
          variant: 'destructive',
        });
        return;
      }

      const { data: result, error } = await supabase.rpc('cast_song_vote', {
          p_setlist_song_id: songId,
        p_user_id: user.id,
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
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
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

  // ---------------------------------- Add song dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState('');

  const openAddDialog = () => {
    if (!show?.artist_id || !setlist?.id) return;
    setAddDialogOpen(true);
  };

  const handleAddFromDropdown = async () => {
    if (!selectedSong || !setlist?.id) return;
    
    const song = artistSongs.find(s => s.id === selectedSong);
    if (!song) return;

    try {
      const { error } = await supabase.rpc('add_song_to_setlist', {
        p_setlist_id: setlist.id,
        p_song_name: song.name,
        p_spotify_id: song.spotify_id,
        p_suggested: true
      });

      if (error) throw error;

      toast({
        title: 'Song Added',
        description: `${song.name} has been added to the setlist`,
      });

      // Reset selection and refresh data
      setSelectedSong('');
      queryClient.invalidateQueries({ queryKey: ['setlist', show?.id] });
    } catch (error) {
      console.error('Error adding song:', error);
      toast({
        title: 'Error',
        description: 'Failed to add song to setlist',
        variant: 'destructive',
      });
    }
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

  const totalVotes = setlist?.songs?.reduce((sum, song) => sum + (song.votes || 0), 0) || 0;
  const votingClosesIn = "2d 14h"; // This should be calculated based on show date
  const fansVoted = 127; // This should come from actual data

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: show.artists?.cover_image_url 
            ? `url(${show.artists.cover_image_url})`
            : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" />
        
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-white/80 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to artist
        </button>

        {/* Upcoming badge */}
        <div className="absolute top-6 right-6 bg-gray-800/80 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
          Upcoming
        </div>

        <div className="absolute bottom-8 left-8 flex items-end gap-6">
          {/* Artist profile image */}
          {show.artists?.image_url && (
            <img
              src={show.artists.image_url}
              alt={show.artists.name}
              className="w-32 h-32 rounded-lg object-cover shadow-2xl"
            />
          )}
          
          <div className="pb-2">
            <h1 className="text-4xl font-bold text-white mb-2">{show.artists?.name || 'Artist'}</h1>
            <h2 className="text-2xl text-white/90 mb-3">{show.name}</h2>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>{new Date(show.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(show.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>{venueInfo?.name}, {venueInfo?.city}, {venueInfo?.state}</span>
              </div>
            </div>
            
            {/* Get Tickets Button */}
            {show.ticket_url && (
              <a 
                href={show.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                Get Tickets
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{totalVotes} votes</span>
                  </div>
                  <button className="flex items-center gap-2 text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>

              {/* Add Song Section */}
              <div className="mb-6">
                <p className="text-white mb-3">Add a song to this setlist:</p>
                <div className="flex gap-3">
                  <select 
                    value={selectedSong}
                    onChange={(e) => setSelectedSong(e.target.value)}
                    className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a song ({artistSongs.length} available)</option>
                    {artistSongs.map((song) => (
                      <option key={song.id} value={song.id}>
                        {song.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={selectedSong ? handleAddFromDropdown : openAddDialog}
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    disabled={!selectedSong && artistSongs.length === 0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {selectedSong ? 'Add to Setlist' : 'Browse Songs'}
                  </button>
                </div>
              </div>

              {/* Songs List */}
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-zinc-400 text-sm font-medium border-b border-zinc-800">
                  <div className="col-span-8">SONG</div>
                  <div className="col-span-4 text-right">VOTES</div>
                </div>
                
                {setlist?.songs?.map((song, index) => (
                  <div 
                    key={song.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-zinc-800/50 rounded-lg transition-colors group"
                  >
                    <div className="col-span-8 flex items-center gap-3">
                      <span className="text-white font-medium">{song.name}</span>
                    </div>
                    <div className="col-span-4 flex items-center justify-end gap-3">
                      <span className="text-white font-bold text-lg">{song.votes || 0}</span>
                      <button 
                        onClick={() => handleVote(song.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                        disabled={userVotes?.some(v => v.setlist_song_id === song.id)}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center text-zinc-500 text-sm">
                Last updated less than a minute ago
              </div>
            </div>
          </div>

          {/* Voting Stats Sidebar */}
          <div className="space-y-6">
            {/* Voting Stats */}
            <div className="bg-zinc-900/50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <h3 className="text-white font-bold">Voting Stats</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-zinc-400 text-sm mb-1">Total Votes</div>
                  <div className="text-white text-3xl font-bold">{totalVotes}</div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="text-zinc-400 text-sm mb-1">Voting Closes In</div>
                  <div className="text-white text-2xl font-bold">{votingClosesIn}</div>
                </div>
                
                <div className="flex items-center gap-2 text-zinc-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{fansVoted} fans have voted</span>
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
                  <p>Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">2</div>
                  <p>Anyone can add songs to the setlist! Select from the dropdown above to help build the perfect concert.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">3</div>
                  <p>Non-logged in users can vote for up to 3 songs. Create an account to vote for unlimited songs!</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">⏰</div>
                  <p>Voting closes 2 hours before the show</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {setlist?.id && (
        <>
        <SongSuggestionDialog
          open={showSuggestionDialog}
          onOpenChange={setShowSuggestionDialog}
          setlistId={setlist.id}
          onSongAdded={handleSongAdded}
          isAuthenticated={!!user}
          guestActionsUsed={guestActionsUsed}
          onGuestActionUsed={incrementGuestActions}
        />
          
          <AddSongDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            setlistId={setlist.id}
            artistId={show?.artist_id || ''}
            onSongAdded={handleSongAdded}
          />
        </>
      )}
      <Footer />
    </div>
  );
}
