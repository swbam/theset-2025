
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Music2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { searchArtists, fetchFeaturedShows, type TicketmasterEvent } from "@/integrations/ticketmaster/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signInWithSpotify, signOut } = useAuth();
  const { toast } = useToast();

  const { data: featuredShows, isLoading } = useQuery({
    queryKey: ['featuredShows'],
    queryFn: fetchFeaturedShows,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchArtists(searchQuery);
      console.log('Search results:', results);
      // We'll implement the search results display in the next iteration
      toast({
        title: "Search completed",
        description: `Found ${results.length} results`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for artists",
        variant: "destructive",
      });
    }
  };

  const handleSpotifyAuth = async () => {
    try {
      if (user) {
        await signOut();
      } else {
        await signInWithSpotify();
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "There was an error with Spotify authentication.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <div className="container px-4 py-16 mx-auto">
        {/* Nav Section */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={handleSpotifyAuth}
            className="glass-morphism hover:bg-white/20"
            variant="ghost"
          >
            {user ? "Sign Out" : "Sign in with Spotify"}
          </Button>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center space-y-8 text-center animate-fade-in">
          <div className="p-3 rounded-full bg-white/5">
            <Music2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Vote for Your Concert Setlist
          </h1>
          <p className="max-w-[600px] text-zinc-400 md:text-xl dark:text-zinc-400">
            Search for your favorite artists, discover upcoming shows, and vote on the songs you want to hear live.
          </p>
          
          {/* Search Section */}
          <div className="w-full max-w-2xl mt-8">
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Search artists..."
                className="w-full h-12 pl-12 glass-morphism"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
              <Button 
                className="absolute right-0 h-12 px-6 glass-morphism hover:bg-white/20"
                variant="ghost"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Shows Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">Featured Shows</h2>
          <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="p-4 overflow-hidden rounded-lg animate-pulse glass-morphism"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-zinc-800 rounded" />
                      <div className="h-3 w-32 bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredShows?.map((show: TicketmasterEvent) => (
              <div
                key={show.name}
                className="p-4 overflow-hidden rounded-lg hover-card glass-morphism"
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${show.images?.[0]?.url || ''})`,
                    }}
                  />
                  <div>
                    <h3 className="font-semibold">{show.name}</h3>
                    <p className="text-sm text-zinc-400">
                      {show._embedded?.venues?.[0]?.name} • {format(new Date(show.dates.start.dateTime), 'MMM d, yyyy')}
                    </p>
                    <Button 
                      variant="link" 
                      className="mt-2 px-0 text-primary hover:text-primary/80"
                      onClick={() => window.open(show.url, '_blank')}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Get Tickets
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
