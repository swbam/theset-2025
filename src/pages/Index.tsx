import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Music2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SearchBar } from '@/components/search/SearchBar';
import { FeaturedArtists } from '@/components/artists/FeaturedArtists';
import { UpcomingShows } from '@/components/shows/UpcomingShows';
import { Button } from '@/components/ui/button';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { fetchPopularTours } from '@/integrations/ticketmaster/artists';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [popularShows, setPopularShows] = useState<any[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Loading popular tours for homepage...');
        const shows = await fetchPopularTours();
        setPopularShows(shows || []);
        console.log('Loaded popular shows:', shows?.length || 0);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Notice',
          description: 'Some content may take a moment to load',
          variant: 'default',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [toast]);

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-full bg-black">
      <TopNavigation />
      {/* Hero Section */}
      <div className="relative py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-white leading-tight">
            Vote on the setlists
            <br />
            you want to hear
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover upcoming concerts and help shape the perfect show by voting
            for your favorite songs.
          </p>
          <SearchBar onArtistClick={handleArtistClick} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Personalized Recommendations */}
        {!user && (
          <section className="text-center py-12">
            <div className="flex flex-col items-center gap-6">
              <Music2 className="w-12 h-12 text-white" />
              <h2 className="text-xl font-semibold text-white">
                Personalized Recommendations
              </h2>
              <p className="text-zinc-400 max-w-md text-sm">
                Connect your Spotify account to get personalized artist
                recommendations and upcoming shows.
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full text-sm"
              >
                Get Started
              </Button>
            </div>
          </section>
        )}

        {/* Trending Shows */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Trending Shows
              </h2>
              <p className="text-zinc-400 text-sm">
                {isLoading ? 'Loading trending shows...' : 'Shows with the most active voting right now'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/shows')}
              className="text-white border-zinc-700 text-sm"
            >
              View all →
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-zinc-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : popularShows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularShows.slice(0, 6).map((show, index) => (
                <div
                  key={show.id || index}
                  className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={() => {
                    const artist = show._embedded?.attractions?.[0];
                    if (artist?.name) {
                      handleArtistClick(artist.name);
                    }
                  }}
                >
                  {show.images?.[0]?.url && (
                    <div 
                      className="w-full h-32 bg-cover bg-center rounded-lg mb-3"
                      style={{ backgroundImage: `url(${show.images[0].url})` }}
                    />
                  )}
                  <h3 className="text-white font-semibold mb-1 truncate">{show.name}</h3>
                  <p className="text-zinc-400 text-sm mb-2 truncate">
                    {show._embedded?.attractions?.[0]?.name}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {show._embedded?.venues?.[0]?.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">No trending shows found</p>
            </div>
          )}
        </section>

        {/* Featured Artists */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Featured Artists
              </h2>
              <p className="text-zinc-400 text-sm">
                {isLoading ? 'Loading featured artists...' : 'Top artists with upcoming shows to vote on'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/artists')}
              className="text-white border-zinc-700 text-sm"
            >
              View all →
            </Button>
          </div>
          <FeaturedArtists onArtistClick={handleArtistClick} shows={popularShows} isLoading={isLoading} />
        </section>

        {/* Upcoming Shows */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Upcoming Shows
              </h2>
              <p className="text-zinc-400 text-sm">
                {isLoading ? 'Loading upcoming shows...' : 'Browse and vote on setlists for upcoming concerts'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/shows')}
              className="text-white border-zinc-700 text-sm"
            >
              View all →
            </Button>
          </div>

          {/* Genre filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              'All Genres',
              'Rock',
              'Pop',
              'Electronic',
              'R&B',
              'Folk',
              'Country',
            ].map((genre) => (
              <Button
                key={genre}
                variant="outline"
                size="sm"
                className="text-sm text-zinc-400 border-zinc-700 hover:bg-zinc-800"
              >
                {genre}
              </Button>
            ))}
          </div>

          <UpcomingShows onArtistClick={handleArtistClick} shows={popularShows.slice(6)} isLoading={isLoading} />
        </section>

        {/* How TheSet Works */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              How TheSet Works
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Shape the perfect concert experience by voting on setlists for
              your favorite artists' upcoming shows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Find Your Artist
              </h3>
              <p className="text-zinc-400">
                Search for your favorite artists and discover their upcoming
                concerts near you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Vote on Songs
              </h3>
              <p className="text-zinc-400">
                Cast your votes on songs you want to hear at the show and see
                what others are voting for.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Experience the Magic
              </h3>
              <p className="text-zinc-400">
                Attend concerts with setlists shaped by fan preferences and
                enjoy the music you love.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Index;