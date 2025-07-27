
import { useNavigate } from "react-router-dom";
import { Music2, Heart, Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/search/SearchBar";
import { PopularTours } from "@/components/shows/PopularTours";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-purple-900/20 to-black py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="p-4 rounded-full bg-purple-500/20 w-fit mx-auto mb-6">
            <Music2 className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Vote on the setlists<br />
            <span className="text-purple-400">you want to hear</span>
          </h1>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Discover upcoming concerts and help shape the perfect show by voting for your favorite songs.
          </p>
          <SearchBar onArtistClick={handleArtistClick} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        {/* Personalized Recommendations */}
        {!user && (
          <section className="text-center py-12">
            <Card className="max-w-md mx-auto bg-purple-900/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 text-purple-400" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  Connect your Spotify account to get personalized artist recommendations and upcoming shows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={signInWithSpotify} className="bg-green-600 hover:bg-green-700">
                  Connect Spotify
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Trending Shows */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Trending Shows</h2>
              <p className="text-zinc-400">Shows with the most active voting right now</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shows')}>
              View all →
            </Button>
          </div>
          <PopularTours onArtistClick={handleArtistClick} />
        </section>

        {/* Featured Artists */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Artists</h2>
              <p className="text-zinc-400">Top artists with upcoming shows to vote on</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/artists')}>
              View all
            </Button>
          </div>
          {/* Featured artists grid will be populated by PopularTours component */}
        </section>

        {/* How TheSet Works */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How TheSet Works</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Shape the perfect concert experience by voting on setlists for your favorite artists' upcoming shows
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">1</span>
                </div>
                <CardTitle>Find Your Artist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-center">
                  Search for your favorite artists and discover their upcoming concerts near you.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <CardTitle>Vote on Songs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-center">
                  Cast your votes on songs you want to hear at the show and see what others are voting for.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <CardTitle>Experience the Magic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-center">
                  Attend concerts with setlists shaped by fan preferences and enjoy the music you love.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Upcoming Shows */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Upcoming Shows</h2>
              <p className="text-zinc-400">Browse and vote on setlists for upcoming concerts</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shows')}>
              View all →
            </Button>
          </div>
          
          {/* Genre filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['All Genres', 'Rock', 'Pop', 'Electronic', 'R&B', 'Folk', 'Country'].map((genre) => (
              <Button key={genre} variant="outline" size="sm" className="text-sm">
                {genre}
              </Button>
            ))}
          </div>
          
          <PopularTours onArtistClick={handleArtistClick} />
        </section>
      </div>
    </div>
  );
};

export default Index;
