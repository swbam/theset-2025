import { ThumbsUp, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";

interface SetlistSongProps {
  id: string;
  songName: string;
  totalVotes: number;
  suggested?: boolean;
  isTopTrack?: boolean;
  onVote: (songId: string) => Promise<void>;
  hasVoted?: boolean;
}

export const SetlistSong = ({ 
  id, 
  songName, 
  totalVotes, 
  suggested,
  isTopTrack,
  onVote, 
  hasVoted 
}: SetlistSongProps) => {
  const [isVoting, setIsVoting] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState(totalVotes);

  const handleVoteClick = async () => {
    if (hasVoted || isVoting) return;
    
    setIsVoting(true);
    // Optimistic update
    setOptimisticVotes(prev => prev + 1);
    
    try {
      await onVote(id);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticVotes(prev => prev - 1);
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  // Update optimistic votes when actual votes change
  useEffect(() => {
    setOptimisticVotes(totalVotes);
  }, [totalVotes]);

  return (
    <div className={cn(
      "flex items-center justify-between bg-white/5 p-4 rounded-lg transition-all duration-200",
      !hasVoted && "hover:bg-white/10",
      isVoting && "scale-[1.01]"
    )}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium">{songName}</p>
          {isTopTrack && (
          <Star className="w-4 h-4 text-yellow-500 animate-in fade-in-50" />
          )}
        </div>
        {suggested && (
          <span className="text-sm text-white/60 bg-white/10 px-2 py-0.5 rounded-full animate-in slide-in-from-left-5">
            Fan suggestion
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(
          "text-white/60 min-w-[2rem] text-right transition-all duration-200",
          hasVoted && "text-white",
          isVoting && "scale-110"
        )}>
          {optimisticVotes || 0}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleVoteClick}
          disabled={hasVoted || isVoting}
          className={cn(
            "transition-all duration-200",
            hasVoted ? 'bg-white/10 text-white' : 'hover:bg-white/10 hover:text-white',
            isVoting && "animate-pulse"
          )}
        >
          <ThumbsUp className={cn(
            "h-4 w-4 transition-transform duration-200",
            hasVoted && "fill-current",
            isVoting && "scale-110"
          )} />
        </Button>
      </div>
    </div>
  );
};
