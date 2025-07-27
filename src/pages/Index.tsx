
import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/search/SearchBar";
import { PopularTours } from "@/components/shows/PopularTours";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-full bg-black">
      {/* Hero Section */}
      <div className="relative py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-white">
            Vote on the setlists<br />
            you want to hear
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            Discover upcoming concerts and help shape the perfect show by voting for your favorite songs.
          </p>
          <SearchBar onArtistClick={handleArtistClick} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Personalized Recommendations */}
        {!user && (
          <section className="text-center py-16">
            <div className="flex flex-col items-center gap-6">
              <Music2 className="w-16 h-16 text-white" />
              <h2 className="text-2xl font-bold text-white">Personalized Recommendations</h2>
              <p className="text-zinc-400 max-w-md">
                Connect your Spotify account to get personalized artist recommendations and upcoming shows.
              </p>
              <Button 
                onClick={signInWithSpotify} 
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-3 rounded-full"
              >
                Connect Spotify
              </Button>
            </div>
          </section>
        )}

        {/* Trending Shows */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Trending Shows</h2>
              <p className="text-zinc-400">Shows with the most active voting right now</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shows')} className="text-white border-zinc-700">
              View all →
            </Button>
          </div>
          <div className="text-center py-8">
            <p className="text-zinc-500">No trending shows found</p>
          </div>
        </section>

        {/* Featured Artists */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Artists</h2>
              <p className="text-zinc-400">Top artists with upcoming shows to vote on</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/artists')} className="text-white border-zinc-700">
              View all →
            </Button>
          </div>
          <PopularTours onArtistClick={handleArtistClick} />
        </section>

        {/* Upcoming Shows */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Upcoming Shows</h2>
              <p className="text-zinc-400">Browse and vote on setlists for upcoming concerts</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shows')} className="text-white border-zinc-700">
              View all →
            </Button>
          </div>
          
          {/* Genre filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['All Genres', 'Rock', 'Pop', 'Electronic', 'R&B', 'Folk', 'Country'].map((genre) => (
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
          
          <PopularTours onArtistClick={handleArtistClick} />
        </section>

        {/* How TheSet Works */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How TheSet Works</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Shape the perfect concert experience by voting on setlists for your favorite artists' upcoming shows
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Find Your Artist</h3>
              <p className="text-zinc-400">
                Search for your favorite artists and discover their upcoming concerts near you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Vote on Songs</h3>
              <p className="text-zinc-400">
                Cast your votes on songs you want to hear at the show and see what others are voting for.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Experience the Magic</h3>
              <p className="text-zinc-400">
                Attend concerts with setlists shaped by fan preferences and enjoy the music you love.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
