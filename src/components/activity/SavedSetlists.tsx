
import { LoadingState } from "@/components/shows/LoadingState";
import { SavedSetlistCard } from "./SavedSetlistCard";

interface SetlistActivity {
  id: string;
  created_at: string;
  name: string;
  shows: {
    artist_name: string;
    venue: string;
  } | null;
}

interface SavedSetlistsProps {
  isLoading: boolean;
  setlists: SetlistActivity[] | undefined;
}

export const SavedSetlists = ({ isLoading, setlists }: SavedSetlistsProps) => {
  if (isLoading) return <LoadingState />;

  if (!setlists?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No setlists saved yet</p>
        <p className="text-sm mt-1">
          Create a setlist for your favorite artists' shows
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {setlists.map((setlist) => (
        <SavedSetlistCard key={setlist.id} setlist={setlist} />
      ))}
    </div>
  );
};
