import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchArtists } from '@/integrations/ticketmaster/artists';
import { useToast } from '@/hooks/use-toast';

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  ticketmaster_id: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Artist[]>([]);
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
        const artists = await searchArtists(searchQuery);
        setResults(artists.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search artists. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleSelectArtist = (artist: Artist) => {
    setOpen(false);
    setQuery('');
    navigate(`/artists/${artist.id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              searchDebounced(value);
              setOpen(value.length > 0);
            }}
            className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 && query.length > 1 ? (
              <CommandEmpty>No artists found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((artist) => (
                  <CommandItem
                    key={artist.id}
                    onSelect={() => handleSelectArtist(artist)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    {artist.image_url && (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{artist.name}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}