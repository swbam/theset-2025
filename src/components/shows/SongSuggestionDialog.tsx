import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Music, Loader2 } from 'lucide-react';
import { searchTracks } from '@/integrations/spotify/client';
import type { SpotifyTrack } from '@/integrations/spotify/client';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SongSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setlistId: string;
  onSongAdded: () => void;
  isAuthenticated?: boolean;
  guestActionsUsed?: number;
  onGuestActionUsed?: () => void;
}

export function SongSuggestionDialog({
  open,
  onOpenChange,
  setlistId,
  onSongAdded,
  isAuthenticated,
  guestActionsUsed = 0,
  onGuestActionUsed,
}: SongSuggestionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchTracks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search for songs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = async (track: SpotifyTrack) => {
    // Check if guest can add songs
    if (!isAuthenticated && guestActionsUsed && guestActionsUsed > 0) {
      toast({
        title: 'Sign in Required',
        description: 'Please sign in to suggest more songs.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
<<<<<<< HEAD
      // Add song via RPC for consistency
      const { error } = await supabase.rpc('add_song_to_setlist', {
        p_setlist_id: setlistId,
        p_song_name: track.name,
        p_spotify_id: track.id,
        p_suggested: true,
      });
=======
      // Get artist ID from setlist
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select(`
          show_id,
          cached_shows!fk_setlists_show_id(artist_id)
        `)
        .eq('id', setlistId)
        .single();
>>>>>>> origin/main

      if (error) throw error;

      toast({
        title: 'Song Added',
        description: `"${track.name}" has been added to the setlist!`,
      });

      // Track guest action if not authenticated
      if (!isAuthenticated && onGuestActionUsed) {
        onGuestActionUsed();
      }

      setSearchQuery('');
      setSearchResults([]);
      onOpenChange(false);
      onSongAdded();
    } catch (error) {
      console.error('Error adding song:', error);
      toast({
        title: 'Error',
        description: 'Failed to add song to setlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Suggest a Song</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a song..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-2">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Music className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{track.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {track.artists.map((a) => a.name).join(', ')} •{' '}
                          {track.album.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddSong(track)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No songs found. Try a different search.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
