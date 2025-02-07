
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SetlistActivity {
  id: string;
  created_at: string;
  name: string;
  shows: {
    artist_name: string;
    venue: string;
  } | null;
}

export const SavedSetlistCard = ({ setlist }: { setlist: SetlistActivity }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm space-y-2">
      <h3 className="text-xl font-semibold">{setlist.shows?.artist_name}</h3>
      <p className="text-muted-foreground">{setlist.shows?.venue}</p>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Saved on {format(new Date(setlist.created_at), 'M/d/yyyy')}
        </p>
        <Button
          variant="secondary"
          onClick={() => navigate(`/setlist/${setlist.id}`)}
        >
          View Setlist
        </Button>
      </div>
    </div>
  );
};
