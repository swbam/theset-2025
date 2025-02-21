
import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { SearchBar } from "../components/search/SearchBar";
import { Button } from "../components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ShowCard } from "../components/shows/ShowCard";
import { fetchPopularShows } from "../integrations/ticketmaster/shows";
import type { TicketmasterEvent } from "../integrations/ticketmaster/types";
import { useToast } from "../components/ui/use-toast";

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: popularShows, isLoading, error, refetch, isError } = useQuery<TicketmasterEvent[]>({
    queryKey: ['popularShows'],
    queryFn: async () => {
      try {
        console.log('Fetching popular shows...');
        const shows = await fetchPopularShows();
        console.log('Received shows:', shows?.length || 0);
        
        if (!shows) {
          console.warn('No shows returned from API');
          throw new Error('Failed to fetch shows from Ticketmaster');
        }

        if (shows.length === 0) {
          console.warn('Empty shows array returned from API');
          throw new Error('No upcoming shows found');
        }

        // Validate show data
        const validShows = shows.filter(show => {
          if (!show._embedded?.attractions?.[0]?.name) {
            console.warn('Show missing artist name:', show.id);
            return false;
          }
          if (!show._embedded?.venues?.[0]?.name) {
            console.warn('Show missing venue name:', show.id);
            return false;
          }
          if (!show.dates?.start?.dateTime) {
            console.warn('Show missing date:', show.id);
            return false;
          }
          return true;
        });

        if (validShows.length === 0) {
          console.warn('No valid shows after filtering');
          throw new Error('No valid shows available');
        }

        console.log(`Returning ${validShows.length} valid shows`);
        return validShows;
      } catch (error) {
        console.error('Error in popularShows query:', error);
        toast({
          title: "Error loading shows",
          description: error instanceof Error 
            ? error.message 
            : "Failed to load popular shows. Please try again later.",
          variant: "destructive"
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true
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

  const handleRetry = () => {
    console.log('Retrying popular shows fetch...');
    toast({
      title: "Retrying...",
      description: "Fetching latest shows from Ticketmaster",
    });
    refetch();
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="h-64 bg-black/30 animate-pulse rounded-lg"
                  role="status"
                  aria-label="Loading shows..."
                />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-400">
              <p>Unable to load shows. Please try again later.</p>
              <p className="text-sm mt-2 text-red-500/70">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : !popularShows || popularShows.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <p>No shows found at the moment.</p>
              <p className="mt-2">Check back later for updates!</p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularShows.map((show: TicketmasterEvent) => (
                <ShowCard 
                  key={show.id} 
                  show={show}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
