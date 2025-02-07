
import { LoadingState } from "@/components/shows/LoadingState";
import { VoteCard } from "./VoteCard";

interface VoteActivity {
  id: string;
  created_at: string;
  setlist_songs: {
    song_name: string;
    setlist: {
      id: string;
      name: string;
      shows: {
        artist_name: string;
        venue: string;
      } | null;
    } | null;
  } | null;
}

interface UserVotesProps {
  isLoading: boolean;
  votes: VoteActivity[] | undefined;
}

export const UserVotes = ({ isLoading, votes }: UserVotesProps) => {
  if (isLoading) return <LoadingState />;

  if (!votes?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No votes yet</p>
        <p className="text-sm mt-1">
          Vote on songs in setlists to help predict show setlists
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {votes.map((vote) => (
        <VoteCard key={vote.id} vote={vote} />
      ))}
    </div>
  );
};
