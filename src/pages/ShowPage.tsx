import { useParams } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { LoadingState } from "../components/shows/LoadingState";
import { EmptyState } from "../components/shows/EmptyState";
import { ShowDetails } from "../components/shows/ShowDetails";
import { Setlist } from "../components/shows/Setlist";
import { useShow } from "../hooks/useShow";
import { useSetlist } from "../hooks/useSetlist";
import { useVotes } from "../hooks/useVotes";

export default function ShowPage() {
  // Get all URL parameters
  const { eventId, artistName, location, date } = useParams<{ 
    eventId: string;
    artistName: string;
    location?: string;
    date?: string;
  }>();
  
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
  const artistNameFromShow = show.artist?.name;
  const artistId = show.artist?.id;

  // Use URL parameters for meta tags if available
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : undefined;

  const formattedLocation = location ? location.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') : undefined;

  // Set meta tags for SEO
  document.title = `${artistNameFromShow || artistName} - ${formattedLocation || show.venue?.name} - ${formattedDate || new Date(show.date).toLocaleDateString()}`;

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
            artistName={artistNameFromShow || artistName}
            artistId={artistId}
          />
        </div>
      </div>
    </div>
  );
}
