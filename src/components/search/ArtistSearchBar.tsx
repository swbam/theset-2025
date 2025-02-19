import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { searchArtists } from "../../integrations/ticketmaster/artistSearch";
import { useToast } from "../../components/ui/use-toast";
import { useDebouncedCallback } from 'use-debounce';

interface ArtistSearchBarProps {
  onArtistClick: (artistName: string) => void;
}

export const ArtistSearchBar = ({ onArtistClick }: ArtistSearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchArtists(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for artists. Please try again.",
        variant: "destructive",
      });
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
          className="w-full h-12 pl-12 glass-morphism"
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
        <div className="absolute z-10 w-full mt-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-xl max-h-[60vh] overflow-y-auto">
          <div className="p-2 space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.name}
                className="p-3 hover:bg-accent/50 rounded-md cursor-pointer transition-colors"
                onClick={() => onArtistClick(result.name)}
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
  );
};
