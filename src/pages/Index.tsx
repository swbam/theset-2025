
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Music2, Calendar, Loader2, MapPin } from "lucide-react";
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { user, signInWithSpotify } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: featuredShows = [], isLoading } = useQuery({
    queryKey: ['featuredShows'],
    queryFn: fetchFeaturedShows,
  });

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchArtists(query);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for artists",
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
    const venue = show._embedded?.venues?.[0];

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
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {venue?.name}
              {venue?.city?.name && `, ${venue.city.name}`}
            </div>
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

  // Group shows by month and sort by venue capacity
  const groupShowsByMonth = (shows: TicketmasterEvent[] = []) => {
    const grouped = shows.reduce((acc, show) => {
      const monthYear = format(new Date(show.dates.start.dateTime), 'MMMM yyyy');
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(show);
      return acc;
    }, {} as Record<string, TicketmasterEvent[]>);

    // Sort each month's shows by venue capacity
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        const capacityA = a._embedded?.venues?.[0]?.capacity || 0;
        const capacityB = b._embedded?.venues?.[0]?.capacity || 0;
        return capacityB - capacityA;
      });
    });

    return Object.entries(grouped).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });
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
              
              <div className="w-full max-w-2xl mx-auto relative">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search for an artist..."
                    className="w-full h-12 pl-12 glass-morphism"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
                  )}
                </div>

                {/* Instant Search Results */}
                {searchResults.length > 0 && searchQuery && (
                  <div className="absolute z-10 w-full mt-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-xl max-h-[60vh] overflow-y-auto">
                    <div className="p-2 space-y-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.name}
                          className="p-3 hover:bg-accent/50 rounded-md cursor-pointer transition-colors"
                          onClick={() => handleArtistClick(result.name)}
                        >
                          <div className="flex items-center gap-3">
                            {result.image && (
                              <div 
                                className="w-12 h-12 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${result.image})` }}
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{result.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {result.venue && (
                                  <span>Next show: {result.venue}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Shows Section */}
            <div className="mt-24 space-y-12">
              <h2 className="text-2xl font-semibold tracking-tight">Top Stadium Tours & Arena Shows</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array(3).fill(0).map((_, i) => (
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
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {groupShowsByMonth(featuredShows).map(([month, shows]) => (
                    <div key={month} className="space-y-6">
                      <h3 className="text-xl font-medium text-muted-foreground">{month}</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {shows.map((show) => (
                          <ShowCard 
                            key={`${show.name}-${show.dates.start.dateTime}-${show._embedded?.venues?.[0]?.name}`} 
                            show={show} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
