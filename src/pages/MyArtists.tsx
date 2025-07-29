import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/shows/LoadingState';
import { Music2, ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import { getTopArtists, getFollowedArtists } from '@/integrations/spotify/client';
import { searchArtists } from '@/integrations/ticketmaster/artists';

interface SpotifyArtist {
  id: string;
  name: string;
  images?: { url: string }[];
  genres?: string[];
  followers?: { total: number };
  external_urls?: { spotify: string };
  popularity?: number;
}

interface ArtistWithShows extends SpotifyArtist {
  upcomingShows?: any[];
  showsLoading?: boolean;
  source?: string;
}

const MyArtists = () => {
  const { user, session, isSpotifyUser } = useAuth();
  const navigate = useNavigate();
  const [artistsWithShows, setArtistsWithShows] = useState<ArtistWithShows[]>([]);

  const spotifyToken = session?.provider_token;

  const { data: topArtists = [], isLoading: topLoading } = useQuery({
    queryKey: ['topArtists', spotifyToken],
    queryFn: () => getTopArtists(spotifyToken!),
    enabled: !!spotifyToken && isSpotifyUser,
  });

  const { data: followedArtists = [], isLoading: followedLoading } = useQuery({
    queryKey: ['followedArtists', spotifyToken],
    queryFn: () => getFollowedArtists(spotifyToken!),
    enabled: !!spotifyToken && isSpotifyUser,
  });

  // Combine top and followed artists, remove duplicates
  const allArtists = [
    ...topArtists.map((artist: SpotifyArtist) => ({ ...artist, source: 'top' })),
    ...followedArtists.map((artist: SpotifyArtist) => ({ ...artist, source: 'followed' }))
  ].filter((artist, index, self) => 
    index === self.findIndex(a => a.id === artist.id)
  );

  // Fetch shows for each artist
  useEffect(() => {
    if (allArtists.length === 0) return;

    const fetchShowsForArtists = async () => {
      const artistsWithShowData = await Promise.all(
        allArtists.map(async (artist) => {
          try {
            const shows = await searchArtists(artist.name);
            return {
              ...artist,
              upcomingShows: shows.slice(0, 3), // Show first 3 upcoming shows
              showsLoading: false,
            };
          } catch (error) {
            console.error(`Error fetching shows for ${artist.name}:`, error);
            return {
              ...artist,
              upcomingShows: [],
              showsLoading: false,
            };
          }
        })
      );
      setArtistsWithShows(artistsWithShowData);
    };

    // Set loading state first
    setArtistsWithShows(allArtists.map(artist => ({ ...artist, showsLoading: true })));
    fetchShowsForArtists();
  }, [allArtists.length]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!isSpotifyUser) {
      navigate('/dashboard');
    }
  }, [user, isSpotifyUser, navigate]);

  if (!user || !isSpotifyUser) return null;

  const isLoading = topLoading || followedLoading;

  if (isLoading) {
    return (
      <SidebarInset>
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
          <LoadingState />
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">My Artists</h1>
          <p className="text-zinc-400">
            Artists you follow and listen to most on Spotify, with their upcoming shows
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Top Artists
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{topArtists.length}</div>
              <p className="text-xs text-zinc-500 mt-1">
                Based on your listening history
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Followed Artists
              </CardTitle>
              <Music2 className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{followedArtists.length}</div>
              <p className="text-xs text-zinc-500 mt-1">
                Artists you follow on Spotify
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Upcoming Shows
              </CardTitle>
              <Calendar className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {artistsWithShows.reduce((total, artist) => total + (artist.upcomingShows?.length || 0), 0)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Shows you can vote on
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Artists Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Your Artists</h2>
          
          {artistsWithShows.length === 0 ? (
            <div className="text-center py-12">
              <Music2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-2">No artists found</p>
              <p className="text-sm text-zinc-500">
                Connect your Spotify account to see your top artists and followed artists
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {artistsWithShows.map((artist) => (
                <Card key={artist.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <div className="flex">
                    {/* Artist Image */}
                    <div className="w-24 h-24 flex-shrink-0">
                      {artist.images?.[0]?.url ? (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                          <Music2 className="w-8 h-8 text-zinc-500" />
                        </div>
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold text-lg truncate">
                            {artist.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {(artist as any).source === 'top' ? 'Top Artist' : 'Followed'}
                            </Badge>
                            <span className="text-zinc-500 text-xs">
                              {artist.followers?.total.toLocaleString()} followers
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => artist.external_urls?.spotify && window.open(artist.external_urls.spotify, '_blank')}
                          className="text-zinc-400 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Genres */}
                      {artist.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {artist.genres.slice(0, 3).map((genre) => (
                            <Badge key={genre} variant="outline" className="text-xs border-zinc-700">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Separator className="bg-zinc-700 mb-3" />

                      {/* Upcoming Shows */}
                      <div>
                        <h4 className="text-sm font-medium text-zinc-300 mb-2">Upcoming Shows</h4>
                        {artist.showsLoading ? (
                          <div className="text-xs text-zinc-500">Loading shows...</div>
                        ) : artist.upcomingShows?.length > 0 ? (
                          <div className="space-y-2">
                            {artist.upcomingShows.slice(0, 2).map((show, index) => (
                              <div key={index} className="text-xs text-zinc-400">
                                <p className="truncate">{show.name}</p>
                                <p className="text-zinc-500">
                                  {show._embedded?.venues?.[0]?.name} • {' '}
                                  {new Date(show.dates?.start?.dateTime).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                              className="text-xs mt-2 h-7 border-zinc-700"
                            >
                              View All Shows
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">No upcoming shows found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  );
};

export default MyArtists;
