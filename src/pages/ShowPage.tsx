
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/shows/LoadingState";
import { EmptyState } from "@/components/shows/EmptyState";
import { ShowDetails } from "@/components/shows/ShowDetails";
import { Setlist } from "@/components/shows/Setlist";
import { useShow } from "@/hooks/useShow";
import { useSetlist } from "@/hooks/useSetlist";
import { useVotes } from "@/hooks/useVotes";

export default function ShowPage() {
  const { eventId, artistName } = useParams<{ eventId: string; artistName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: show, isLoading: showLoading } = useShow(eventId);
  const { data: setlist, isLoading: setlistLoading, addSong } = useSetlist(show?.id, user);
  const { userVotes, handleVote } = useVotes(setlist?.id, user);

  const handleSuggest = async (songName: string, spotifyId?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to suggest songs",
        variant: "destructive"
      });
      return;
    }

    if (!setlist) {
      toast({
        title: "Error",
        description: "Setlist not available",
        variant: "destructive"
      });
      return;
    }

    await addSong({ songName, setlistId: setlist.id, spotifyId });
  };

  if (showLoading || setlistLoading) {
    return <LoadingState />;
  }

  if (!show) {
    return <EmptyState />;
  }

  // Get the artist data from the properly joined query
  const displayArtistName = show.artist?.name || artistName?.replace(/-/g, ' ');
  const artistId = show.artist?.id;

  console.log('Show data:', {
    showId: show.id,
    artistName: displayArtistName,
    artistId,
    setlistId: setlist?.id,
    setlist: setlist
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <ShowDetails
            name={show.name}
            date={show.date}
            venue={show.venue}
          />
          <Setlist
            setlist={setlist}
            userVotes={userVotes}
            user={user}
            onVote={handleVote}
            onSuggest={handleSuggest}
            artistName={displayArtistName}
            artistId={artistId}
          />
        </div>
      </div>
    </div>
  );
}
