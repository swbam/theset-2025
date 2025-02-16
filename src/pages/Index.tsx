
import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ShowCard } from "@/components/shows/ShowCard";
import { fetchPopularShows } from '@/integrations/ticketmaster/shows';
import type { TicketmasterEvent } from "@/integrations/ticketmaster/types";

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();

  const { data: popularShows, isLoading } = useQuery({
    queryKey: ['popularShows'],
    queryFn: () => fetchPopularShows(),
  });

  const handleArtistClick = (artistName: string) => {
    const encodedName = artistName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    console.log('Navigating to artist:', encodedName);
    navigate(`/artist/${encodedName}`);
  };

  return (
    <div className="min-h-full p-6 space-y-12">
      <div className="flex flex-col space-y-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="p-3 rounded-full bg-white/5 w-fit mx-auto">
            <Music2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mt-4 sm:text-5xl xl:text-6xl">
            Vote for Your Concert Setlist
          </h1>
          <p className="mt-4 text-zinc-400 md:text-xl">
            Search for your favorite artists, discover upcoming shows, and vote on the songs you want to hear live.
          </p>
          {!user && (
            <Button
              onClick={signInWithSpotify}
              className="mt-6 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            >
              Sign in with Spotify
            </Button>
          )}
        </div>
        
        <SearchBar onArtistClick={handleArtistClick} />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Popular Shows Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Popular Shows</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-black/30 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularShows?.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
