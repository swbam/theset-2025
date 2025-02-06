
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Music2, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { searchArtists, fetchFeaturedShows, type TicketmasterEvent } from "@/integrations/ticketmaster/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TicketmasterEvent[]>([]);
  const { user, signInWithSpotify } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const { data: featuredShows, isLoading } = useQuery({
    queryKey: ['featuredShows'],
    queryFn: fetchFeaturedShows,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchArtists(searchQuery);
      setSearchResults(results);
      toast({
        title: "Search completed",
        description: `Found ${results.length} upcoming shows`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for shows",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleArtistClick = (artistName: string) => {
    // Navigate to artist page with encoded name as parameter
    navigate(`/dashboard/artist/${encodeURIComponent(artistName)}`);
  };

  const ShowCard = ({ show }: { show: TicketmasterEvent }) => (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleArtistClick(show.name)}>
      <CardHeader className="flex flex-row items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0"
          style={{
            backgroundImage: `url(${show.images?.[0]?.url || ''})`,
          }}
        />
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{show.name}</h3>
          <p className="text-sm text-muted-foreground">
            {show._embedded?.venues?.[0]?.name}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {format(new Date(show.dates.start.dateTime), 'EEEE, MMMM d, yyyy')}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            window.open(show.url, '_blank');
          }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Get Tickets
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <div className="container px-4 py-16 mx-auto">
        {/* Nav Section */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={signInWithSpotify}
            className="glass-morphism hover:bg-white/20"
            variant="ghost"
          >
            Sign in with Spotify
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
                placeholder="Search for an artist..."
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
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">Search Results</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((show) => (
                <ShowCard key={show.name + show.dates.start.dateTime} show={show} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Shows Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">Top Upcoming Shows</h2>
          <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-accent rounded" />
                      <div className="h-3 w-32 bg-accent rounded" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 w-40 bg-accent rounded" />
                  </CardContent>
                </Card>
              ))
            ) : featuredShows?.map((show) => (
              <ShowCard key={show.name + show.dates.start.dateTime} show={show} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
