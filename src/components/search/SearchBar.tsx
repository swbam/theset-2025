import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toSlug } from '@/utils/slug';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'artist' | 'venue' | 'show';
  name: string;
  image_url?: string | null;
  extra?: Record<string, unknown>;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const searchDebounced = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Search in our database first
        const like = `%${searchQuery}%`;
        
        const [artistsRes, venuesRes, showsRes] = await Promise.all([
          supabase
            .from('artists')
            .select('id, name, image_url')
            .ilike('name', like)
            .limit(5),
          supabase
            .from('venues')
            .select('id, name')
            .ilike('name', like)
            .limit(3),
          supabase
            .from('cached_shows')
            .select('id, name, date')
            .ilike('name', like)
            .limit(3)
        ]);

        const searchResults: SearchResult[] = [];

        if (!artistsRes.error && artistsRes.data) {
          searchResults.push(
            ...artistsRes.data.map(a => ({
              id: a.id,
              type: 'artist' as const,
              name: a.name,
              image_url: a.image_url
            }))
          );
        }

        if (!venuesRes.error && venuesRes.data) {
          searchResults.push(
            ...venuesRes.data.map(v => ({
              id: v.id,
              type: 'venue' as const,
              name: v.name
            }))
          );
        }

        if (!showsRes.error && showsRes.data) {
          searchResults.push(
            ...showsRes.data.map(s => ({
              id: s.id,
              type: 'show' as const,
              name: s.name
            }))
          );
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchDebounced(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchDebounced]);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery('');
    
    if (item.type === 'artist') {
      navigate(`/artist/${toSlug(item.name)}`);
    } else if (item.type === 'venue') {
      // Navigate to venue page or shows filtered by venue
      navigate(`/shows?venue=${item.name}`);
    } else if (item.type === 'show') {
      // Navigate to show page
      navigate(`/show/${toSlug(item.name)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search artists, venues, shows..."
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setOpen(value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 bg-background/90 backdrop-blur-sm border-border"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 && query.length > 1 ? (
              <CommandEmpty>
                No results found. Press Enter to search more.
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    {result.image_url && (
                      <img
                        src={result.image_url}
                        alt={result.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{result.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {result.type}
                      </p>
                    </div>
                  </CommandItem>
                ))}
                {query.length > 1 && (
                  <CommandItem
                    onSelect={() => {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                      setOpen(false);
                    }}
                    className="border-t p-3 cursor-pointer"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search for "{query}"
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}