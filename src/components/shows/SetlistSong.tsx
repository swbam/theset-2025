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
    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg hover:bg-muted transition-colors">
      <div className="space-y-1">
        <p className="text-foreground font-medium">{songName}</p>
        {suggested && (
          <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Fan suggestion
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground min-w-[2rem] text-right">
          {totalVotes || 0}
        </span>
        <Button
          variant="outline"
          size={!isAuthenticated && guestActionsUsed > 0 ? "sm" : "icon"}
          onClick={() => onVote(id)}
          disabled={hasVoted || !canVote}
          className={`${
            hasVoted 
              ? 'bg-accent text-accent-foreground' 
              : !canVote 
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-accent hover:text-accent-foreground'
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
