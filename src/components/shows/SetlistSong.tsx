import { ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SetlistSongProps {
  id: string;
  songName: string;
  totalVotes: number;
  suggested?: boolean;
  onVote: (songId: string) => Promise<void>;
  hasVoted?: boolean;
  isAuthenticated?: boolean;
  guestActionsUsed?: number;
}

export const SetlistSong = ({
  id,
  songName,
  totalVotes,
  suggested,
  onVote,
  hasVoted,
  isAuthenticated,
  guestActionsUsed = 0,
}: SetlistSongProps) => {
  const canVote = isAuthenticated || guestActionsUsed === 0;
  const buttonText = !isAuthenticated && guestActionsUsed > 0 
    ? 'Sign in to vote' 
    : hasVoted 
      ? 'Voted' 
      : 'Vote';

  return (
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
      <span className="text-white/60 min-w-[2rem] text-right">
        {totalVotes || 0}
      </span>
      <Button
        variant="outline"
        size={!isAuthenticated && guestActionsUsed > 0 ? "sm" : "icon"}
        onClick={() => onVote(id)}
        disabled={hasVoted || !canVote}
        className={`${
          hasVoted 
            ? 'bg-white/10 text-white' 
            : !canVote 
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white/10 hover:text-white'
        }`}
      >
        {!isAuthenticated && guestActionsUsed > 0 ? (
          buttonText
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
  );
};
