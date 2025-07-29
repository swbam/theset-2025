import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Music } from 'lucide-react';
import { searchArtists } from '@/integrations/ticketmaster/client';
import { useToast } from '@/components/ui/use-toast';

interface SearchResult {
  name: string;
  image?: string;
  venue?: string;
  ticketmaster_id?: string;
}

interface SearchBarProps {
  onArtistClick: (artistName: string) => void;
}

export const SearchBar = ({ onArtistClick }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      console.log('Searching for artists:', query);
      const results = await searchArtists(query);
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for artists. Please try again.',
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleArtistClick = (artistName: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    onArtistClick(artistName);
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for an artist..."
          className="w-full h-12 pl-12 glass-morphism"
          value={searchQuery}
          onChange={handleInputChange}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
        )}
      </div>

      {(searchResults.length > 0 || (hasSearched && !isSearching)) && searchQuery && (
        <div className="absolute z-10 w-full mt-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-xl max-h-[60vh] overflow-y-auto">
          <div className="p-2 space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div
                  key={`${result.name}-${index}`}
                  className="p-3 hover:bg-accent/50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleArtistClick(result.name)}
                >
                  <div className="flex items-center gap-3">
                    {result.image ? (
                      <div
                        className="w-12 h-12 rounded-full bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${result.image})` }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{result.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.venue ? `Next show: ${result.venue}` : 'Click to view shows'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No artists found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching for a different artist name</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};