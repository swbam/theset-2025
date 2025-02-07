
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetlistSong } from "./SetlistSong";
import { useSpotifyTracks } from "@/hooks/useSpotifyTracks";
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
}

export const Setlist = ({ setlist, userVotes, user, onVote, onSuggest, artistName }: SetlistProps) => {
  const [newSong, setNewSong] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Auto-populate with top tracks if empty
  useSpotifyTracks(artistName, setlist?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.trim()) return;

    try {
      await onSuggest(newSong);
      setNewSong("");
      setIsAdding(false);
    } catch (error) {
      console.error('Error suggesting song:', error);
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
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newSong}
            onChange={(e) => setNewSong(e.target.value)}
            placeholder="Enter song name"
            className="bg-white/5 border-white/10 text-white"
          />
          <Button type="submit" variant="outline">Add</Button>
          <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </form>
      )}
      
      {setlist ? (
        <div className="space-y-2">
          {setlist.songs?.map((song) => (
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
          ))}
        </div>
      ) : (
        <div className="text-white/60 py-8 text-center space-y-2">
          <p>The setlist for this show will be available soon.</p>
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
  );
};
