
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetlistSong } from "./SetlistSong";
import { useSpotifyTracks } from "@/hooks/useSpotifyTracks";
import { useArtistSongs } from "@/hooks/useArtistSongs";
import type { User } from "@supabase/supabase-js";

interface SetlistProps {
  setlist: {
    id: string;
    songs?: Array<{
      id: string;
      song_name: string;
      total_votes: number;
      suggested?: boolean;
      spotify_id?: string;
      is_top_track?: boolean;
    }>;
  } | null;
  userVotes?: string[];
  user: User | null;
  onVote: (songId: string) => Promise<void>;
  onSuggest: (songName: string, spotifyId?: string) => Promise<void>;
  artistName?: string;
  artistId?: string;
}

export const Setlist = ({ setlist, userVotes, user, onVote, onSuggest, artistName, artistId }: SetlistProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<string>("");

  // Auto-populate with top tracks if empty
  const { isLoading: isLoadingTopTracks } = useSpotifyTracks(artistName, setlist?.id);

  // Get artist's songs for the dropdown
  const { data: songs = [], isLoading: isLoadingSongs } = useArtistSongs(artistId);

  const handleSongSelect = async (songId: string) => {
    const song = songs?.find(s => s.spotify_id === songId);
    if (song) {
      try {
        await onSuggest(song.name, song.spotify_id);
        setSelectedSong("");
        setOpen(false);
        setIsAdding(false);
      } catch (error) {
        console.error('Error suggesting song:', error);
      }
    }
  };

  const handleAddClick = () => {
    if (!user) {
      // If not logged in, this will show the login prompt
      onSuggest("");
      return;
    }
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Setlist</h2>
        {!isAdding && (
          <Button
            variant="outline"
            onClick={handleAddClick}
            className="hover:bg-white/10 hover:text-white"
          >
            Suggest a song
          </Button>
        )}
      </div>
      
      {isAdding && (
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedSong
                  ? songs?.find((song) => song.spotify_id === selectedSong)?.name ?? "Select a song..."
                  : "Select a song..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search songs..." />
                <CommandEmpty>No songs found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-auto">
                  {(songs || []).map((song) => (
                    <CommandItem
                      key={song.spotify_id}
                      value={song.name}
                      onSelect={() => handleSongSelect(song.spotify_id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSong === song.spotify_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {song.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button type="button" variant="ghost" onClick={() => {
            setIsAdding(false);
            setSelectedSong("");
          }}>
            Cancel
          </Button>
        </div>
      )}
      
      <div className="space-y-2">
        {isLoadingTopTracks ? (
          <div className="text-white/60 py-8 text-center">
            Loading top tracks...
          </div>
        ) : setlist?.songs && setlist.songs.length > 0 ? (
          setlist.songs.map((song) => (
            <SetlistSong
              key={song.id}
              id={song.id}
              songName={song.song_name}
              totalVotes={song.total_votes}
              suggested={song.suggested}
              isTopTrack={song.is_top_track}
              onVote={onVote}
              hasVoted={userVotes?.includes(song.id)}
            />
          ))
        ) : (
          <div className="text-white/60 py-8 text-center space-y-2">
            <p>No songs have been added to this setlist yet.</p>
            <p>Be the first to suggest what {artistName} might play!</p>
            {!isAdding && (
              <Button
                variant="outline"
                onClick={handleAddClick}
                className="mt-4 hover:bg-white/10 hover:text-white"
              >
                Suggest a song
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
