
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

export const VoteCard = ({ vote }: { vote: VoteActivity }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm space-y-2">
      <h3 className="text-xl font-semibold">
        {vote.setlist_songs?.setlist?.shows?.artist_name}
      </h3>
      <p className="text-muted-foreground">
        {vote.setlist_songs?.setlist?.shows?.venue}
      </p>
      <p className="text-sm">
        Voted for "{vote.setlist_songs?.song_name}"
      </p>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Voted on {format(new Date(vote.created_at), 'M/d/yyyy')}
        </p>
        <Button
          variant="secondary"
          onClick={() => navigate(`/setlist/${vote.setlist_songs?.setlist?.id}`)}
        >
          View Setlist
        </Button>
      </div>
    </div>
  );
};
