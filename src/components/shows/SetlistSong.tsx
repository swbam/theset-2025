
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
  <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
    <div className="space-y-1">
      <p className="text-white font-medium">{songName}</p>
      {suggested && (
        <span className="text-sm text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
          Fan suggestion
        </span>
      )}
    </div>
    <div className="flex items-center gap-3">
      <span className="text-white/60 min-w-[2rem] text-right">{totalVotes || 0}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onVote(id)}
        disabled={hasVoted}
        className={`${hasVoted ? 'bg-white/10 text-white' : 'hover:bg-white/10 hover:text-white'}`}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
