
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetlistSongProps {
  id: string;
  songName: string;
  totalVotes: number;
  suggested?: boolean;
  onVote: (songId: string) => Promise<void>;
  hasVoted?: boolean;
}

export const SetlistSong = ({ 
  id, 
  songName, 
  totalVotes, 
  suggested, 
  onVote, 
  hasVoted 
}: SetlistSongProps) => (
  <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
    <div>
      <p className="text-white">{songName}</p>
      {suggested && (
        <span className="text-sm text-white/60">Fan suggestion</span>
      )}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-white/60">{totalVotes || 0}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onVote(id)}
        disabled={hasVoted}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
