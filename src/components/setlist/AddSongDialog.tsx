import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddSongDialogProps {
  artistId: string;
  setlistId: string;
  open: boolean;
  onClose: () => void;
  onSongAdded?: () => void;
}

interface CachedSong {
  id: string;
  name: string;
  spotify_id: string;
}

export const AddSongDialog: React.FC<AddSongDialogProps> = ({
  artistId,
  setlistId,
  open,
  onClose,
  onSongAdded,
}) => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<CachedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  // Load cached songs for artist once
  useEffect(() => {
    if (!open) return;
    (async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('cached_songs')
        .select('*')
        .eq('artist_id', artistId)
        .order('popularity', { ascending: false })
        .limit(100);

      setSongs((data as CachedSong[]) || []);
      setIsLoading(false);
    })();
  }, [artistId, open]);

  const filtered = query.length > 0 ? songs.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())) : songs;

  const handleAdd = async (song: CachedSong) => {
    if (adding) return;
    setAdding(song.id);
    try {
      const { error } = await supabase.rpc('add_song_to_setlist', {
        p_setlist_id: setlistId,
        p_song_id: song.id,
      });
      if (error) throw error;
      onSongAdded?.();
      onClose();
    } catch (err) {
      console.error('Failed to add song', err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a song</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-4"
        />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {isLoading && <p className="text-center text-sm">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-sm">No songs found</p>
          )}
          {filtered.map((song) => (
            <Button
              key={song.id}
              variant="ghost"
              disabled={adding !== null}
              className="w-full justify-start"
              onClick={() => handleAdd(song)}
            >
              {adding === song.id ? 'Adding…' : song.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

