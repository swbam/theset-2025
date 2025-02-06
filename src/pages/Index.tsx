
import { useState } from "react";
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
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TicketmasterEvent[]>([]);
  const { user, signInWithSpotify } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try searching for a different artist",
        });
      } else {
        toast({
          title: "Search completed",
          description: `Found ${results.length} upcoming shows`,
        });
      }
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
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  const ShowCard = ({ show }: { show: TicketmasterEvent }) => {
    const artistName = show._embedded?.attractions?.[0]?.name || show.name;
    const artistImage = show._embedded?.attractions?.[0]?.images?.[0]?.url || show.images?.[0]?.url;

    return (
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleArtistClick(artistName)}>
        <CardHeader className="flex flex-row items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0"
            style={{
              backgroundImage: `url(${artistImage || ''})`,
              backgroundColor: !artistImage ? 'rgba(255,255,255,0.1)' : undefined,
            }}
          />
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">{artistName}</h3>
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
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        <DashboardSidebar />
        <SidebarInset>
          <div className="h-full p-6">
            <div className="flex flex-col space-y-8 max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="p-3 rounded-full bg-white/5 w-fit mx-auto">
                  <Music2 className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold tracking-tighter mt-4 sm:text-5xl">
                  Vote for Your Concert Setlist
                </h1>
                <p className="mt-4 text-zinc-400 md:text-xl">
                  Search for your favorite artists, discover upcoming shows, and vote on the songs you want to hear live.
                </p>
              </div>
              
              <div className="w-full max-w-2xl mx-auto">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
