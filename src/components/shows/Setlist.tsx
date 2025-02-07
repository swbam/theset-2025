
import { Button } from "@/components/ui/button";
import { SetlistSong } from "./SetlistSong";
import type { User } from "@supabase/supabase-js";

interface SetlistProps {
  setlist: {
    id: string;
    songs?: Array<{
      id: string;
      song_name: string;
      total_votes: number;
      suggested?: boolean;
    }>;
  } | null;
  userVotes?: string[];
  user: User | null;
  onVote: (songId: string) => Promise<void>;
  onSuggest: () => void;
}

export const Setlist = ({ setlist, userVotes, user, onVote, onSuggest }: SetlistProps) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-semibold text-white">Setlist</h2>
    {setlist ? (
      <div className="space-y-4">
        {setlist.songs?.map((song) => (
          <SetlistSong
            key={song.id}
            id={song.id}
            songName={song.song_name}
            totalVotes={song.total_votes}
            suggested={song.suggested}
            onVote={onVote}
            hasVoted={userVotes?.includes(song.id)}
          />
        ))}
      </div>
    ) : (
      <div className="text-white/60">
        <p>The setlist for this show will be available soon.</p>
        {user && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={onSuggest}
          >
            Suggest a song
          </Button>
        )}
      </div>
    )}
  </div>
);
