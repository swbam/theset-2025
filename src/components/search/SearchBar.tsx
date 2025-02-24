
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { searchArtists } from "../../integrations/ticketmaster/client";
import { useToast } from "../../components/ui/use-toast";
import { useDebouncedCallback } from 'use-debounce';
import type { TicketmasterEvent } from "../../integrations/ticketmaster/types";

interface SearchResult {
  name: string;
  image?: string;
  venue?: string;
  date?: string;
  relevanceScore?: number;
}

interface SearchBarProps {
  onArtistClick: (artistName: string) => void;
}

export const SearchBar = ({ onArtistClick }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const events = await searchArtists(query);
      
      // Transform events into search results
      const results: SearchResult[] = events.map((event: TicketmasterEvent) => {
        const artist = event._embedded?.attractions?.[0];
        const venue = event._embedded?.venues?.[0];
        const date = event.dates?.start?.dateTime;
        const capacity = venue?.capacity ? parseInt(venue.capacity) : 0;
        
        // Calculate relevance score
        let relevanceScore = 0;
        if (artist?.name) {
          // Exact match gets highest score
          if (artist.name.toLowerCase() === query.toLowerCase()) {
            relevanceScore += 1000000;
          }
          // Partial match gets medium score
          else if (artist.name.toLowerCase().includes(query.toLowerCase())) {
            relevanceScore += 100000;
          }
          // Add venue capacity to score
          relevanceScore += capacity;
        }
        
        return {
          name: artist?.name || '',
          image: artist?.images?.[0]?.url || event.images?.[0]?.url,
          venue: venue?.displayName || venue?.name,
          date: date ? new Date(date).toLocaleDateString() : undefined,
          relevanceScore
        };
      });

      // Filter out duplicates and sort results
      const uniqueResults = results.reduce((acc: SearchResult[], curr) => {
        const exists = acc.some(r => r.name.toLowerCase() === curr.name.toLowerCase());
        if (!exists && curr.name) {
          acc.push(curr);
        }
        return acc;
      }, []);

      // Sort results by relevance
      const sortedResults = uniqueResults.sort((a, b) => {
        // Use calculated relevance score
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      });

      setSearchResults(sortedResults.slice(0, 10)); // Limit to top 10 results
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for artists. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for an artist..."
          className="w-full h-12 pl-12 bg-black/30 border-white/10 focus-visible:ring-white/20"
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
            debouncedSearch(value);
          }}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
        )}
      </div>

      {searchResults.length > 0 && searchQuery && (
        <div className="absolute z-10 w-full mt-2 bg-black/95 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl max-h-[60vh] overflow-y-auto">
          <div className="p-2 space-y-1">
            {searchResults.map((result) => (
              <div
                key={result.name}
                className="p-3 hover:bg-white/5 rounded-md cursor-pointer transition-colors"
                onClick={() => {
                  onArtistClick(result.name);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <div className="flex items-center gap-3">
                  {result.image && (
                    <div 
                      className="w-12 h-12 rounded-full bg-cover bg-center bg-black/30"
                      style={{ backgroundImage: `url(${result.image})` }}
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-white">{result.name}</h4>
                    {(result.venue || result.date) && (
                      <p className="text-sm text-zinc-400">
                        {result.venue && <span>Next show: {result.venue}</span>}
                        {result.venue && result.date && <span> • </span>}
                        {result.date && <span>{result.date}</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
