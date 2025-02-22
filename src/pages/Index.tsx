
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
import { EmptyState } from "../components/shows/EmptyState";
import { LoadingState } from "../components/shows/LoadingState";

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: popularShows, isLoading, error, refetch } = useQuery<TicketmasterEvent[]>({
    queryKey: ['popularShows'],
    queryFn: async () => {
      try {
        console.log('Fetching popular shows...');
        const shows = await fetchPopularShows();
        
        if (!shows) {
          console.warn('No shows returned from API');
          return [];
        }

        // Validate show data
        const validShows = shows.filter(show => {
          const isValid = !!(
            show._embedded?.attractions?.[0]?.name &&
            show._embedded?.venues?.[0]?.name &&
            show.dates?.start?.dateTime
          );

          if (!isValid) {
            console.warn('Filtering out invalid show:', show.id);
          }

          return isValid;
        });

        if (validShows.length === 0) {
          console.warn('No valid shows after filtering');
          return [];
        }

        console.log(`Returning ${validShows.length} valid shows`);
        return validShows;
      } catch (error) {
        console.error('Error in popularShows query:', error);
        
        // Check if it's a Supabase Edge Function error
        if (error instanceof Error && error.message.includes('Edge Function')) {
          toast({
            title: "API Service Unavailable",
            description: "We're having trouble connecting to our show data service. Please try again later.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error loading shows",
            description: error instanceof Error 
              ? error.message 
              : "Failed to load popular shows. Please try again later.",
            variant: "destructive"
          });
        }
        
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on Edge Function errors
      if (error instanceof Error && error.message.includes('Edge Function')) {
        return false;
      }
      return failureCount < 3;
    },
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
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Popular Shows</h2>
          {isLoading ? (
            <LoadingState />
          ) : error || !popularShows || popularShows.length === 0 ? (
            <EmptyState
              title="No shows available"
              description="We're having trouble loading shows right now. Please try again later."
              action={
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                >
                  Retry
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularShows.map((show) => (
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
