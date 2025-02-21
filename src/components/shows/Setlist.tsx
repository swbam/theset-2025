
import { useState, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "../../components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { SetlistSong } from "./SetlistSong";
import { useSpotifyTracks } from "../../hooks/useSpotifyTracks";
import { useArtistSongs } from "../../hooks/useArtistSongs";
import { useVotingSystem } from "../../hooks/useVotingSystem";
import type { User } from "@supabase/supabase-js";

interface SetlistProps {
  setlist: {
    id: string;
    songs?: Array<{
      id: string;
      song_name: string;
      suggested?: boolean;
      is_top_track?: boolean;
    }>;
  } | null;
  user: User | null;
  onSuggest: (songName: string) => Promise<void>;
  artistName?: string;
  artistId?: string;
}

export const Setlist = ({ setlist, user, onSuggest, artistName, artistId }: SetlistProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  // Auto-populate with top tracks if empty
  const { isLoading: isLoadingTopTracks } = useSpotifyTracks(artistName, setlist?.id);

  // Get artist's songs for the dropdown
  const { data: songs = [] } = useArtistSongs(artistId);

  // Use the new voting system
  const { 
    castVote, 
    getVoteCount, 
    hasVoted, 
    isVoting 
  } = useVotingSystem(setlist?.id, user);

  // Sort songs by votes (highest to lowest)
  const sortedSongs = useMemo(() => {
    if (!setlist?.songs) return [];
    return [...setlist.songs].sort((a, b) => {
      const votesA = getVoteCount(a.id);
      const votesB = getVoteCount(b.id);
      return votesB - votesA;
    });
  }, [setlist?.songs, getVoteCount]);

  const handleSongSelect = async (currentValue: string) => {
    const song = songs.find(s => s.name.toLowerCase() === currentValue.toLowerCase());
    if (song) {
      try {
        await onSuggest(song.name);
        setValue("");
        setOpen(false);
        setIsAdding(false);
      } catch (error) {
        console.error('Error suggesting song:', error);
      }
    }
  };

  const handleAddClick = () => {
    if (!user) {
      onSuggest("");
      return;
    }
    setIsAdding(true);
  };

  // Filter out songs that are already in the setlist
  const availableSongs = useMemo(() => {
    const existingSongNames = new Set(setlist?.songs?.map(s => s.song_name.toLowerCase()));
    return songs.filter(song => !existingSongNames.has(song.name.toLowerCase()));
  }, [songs, setlist?.songs]);

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
                {value || "Select a song..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command value={value} onValueChange={setValue}>
                <CommandInput placeholder="Search songs..." />
                <CommandEmpty>No songs found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-auto">
                  {availableSongs.map((song) => (
                    <CommandItem
                      key={song.id}
                      value={song.name}
                      onSelect={handleSongSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === song.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {song.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              setIsAdding(false);
              setValue("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      
      <div className="space-y-2">
        {isLoadingTopTracks ? (
          <div className="text-white/60 py-8 text-center">
            Loading top tracks...
          </div>
        ) : sortedSongs.length > 0 ? (
          <div className="grid gap-2">
            {sortedSongs.map((song, index) => (
              <div
                key={song.id}
                className="animate-in fade-in-50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SetlistSong
                  id={song.id}
                  songName={song.song_name}
                  voteCount={getVoteCount(song.id)}
                  suggested={song.suggested}
                  isTopTrack={song.is_top_track}
                  onVote={castVote}
                  hasVoted={hasVoted(song.id)}
                  isVoting={isVoting}
                />
              </div>
            ))}
          </div>
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
}
