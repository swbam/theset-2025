import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Plus, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Song {
  id: string;
  song_name: string;
  total_votes: number;
  suggested: boolean;
  preview_url?: string;
}

interface VotingInterfaceProps {
  songs: Song[];
  userVotes: string[];
  onVote: (songId: string) => void;
  onSuggest: () => void;
  isAuthenticated: boolean;
  guestActionsUsed: number;
}

export const VotingInterface = ({
  songs,
  userVotes,
  onVote,
  onSuggest,
  isAuthenticated,
  guestActionsUsed
}: VotingInterfaceProps) => {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  const sortedSongs = [...songs].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.total_votes - a.total_votes;
    }
    return 0; // For 'recent', maintain original order
  });

  const handleVote = (songId: string) => {
    if (!isAuthenticated && guestActionsUsed >= 1) {
      toast({
        title: 'Sign in Required',
        description: 'Please sign in to vote for more songs',
        variant: 'destructive',
      });
      return;
    }

    if (userVotes.includes(songId)) {
      toast({
        title: 'Already Voted',
        description: 'You have already voted for this song',
        variant: 'destructive',
      });
      return;
    }

    onVote(songId);
  };

  const handleSuggest = () => {
    if (!isAuthenticated && guestActionsUsed >= 1) {
      toast({
        title: 'Sign in Required',
        description: 'Please sign in to suggest songs',
        variant: 'destructive',
      });
      return;
    }

    onSuggest();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Vote on the Setlist</h2>
          <p className="text-gray-400">
            Help shape this concert by voting for the songs you want to hear
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === 'votes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('votes')}
            className="text-sm"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Top Voted
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className="text-sm"
          >
            <Clock className="w-4 h-4 mr-1" />
            Recent
          </Button>
        </div>
      </div>

      {/* Add Song Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSuggest}
          className="bg-green-500 hover:bg-green-600 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Suggest a Song
        </Button>
      </div>

      {/* Guest Voting Limit Notice */}
      {!isAuthenticated && guestActionsUsed > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            You've used your guest voting action. Sign in to vote for more songs and track your activity!
          </p>
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-3">
        {sortedSongs.map((song, index) => {
          const hasVoted = userVotes.includes(song.id);
          const rank = sortBy === 'votes' ? index + 1 : null;
          
          return (
            <div
              key={song.id}
              className={`
                bg-gray-900 border border-gray-800 rounded-lg p-4 
                hover:bg-gray-800 transition-all duration-200
                ${hasVoted ? 'ring-1 ring-green-500' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {rank && (
                    <div className="flex-shrink-0">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${rank <= 3 ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}
                      `}>
                        {rank}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {song.song_name}
                      </h3>
                      {song.suggested && (
                        <Badge variant="secondary" className="text-xs">
                          Fan Suggested
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {song.total_votes} {song.total_votes === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleVote(song.id)}
                  disabled={hasVoted}
                  variant={hasVoted ? 'secondary' : 'outline'}
                  size="sm"
                  className={`
                    flex-shrink-0
                    ${hasVoted 
                      ? 'bg-green-500 text-black hover:bg-green-600' 
                      : 'border-gray-600 text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Heart 
                    className={`w-4 h-4 mr-1 ${hasVoted ? 'fill-current' : ''}`} 
                  />
                  {hasVoted ? 'Voted' : 'Vote'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No songs yet</h3>
          <p className="text-gray-400 mb-4">Be the first to suggest a song for this setlist!</p>
          <Button onClick={handleSuggest} className="bg-green-500 hover:bg-green-600 text-black">
            <Plus className="w-4 h-4 mr-2" />
            Suggest the First Song
          </Button>
        </div>
      )}
    </div>
  );
};