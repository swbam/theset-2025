
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
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: show, isLoading: showLoading } = useShow(eventId);
  const { data: setlist, isLoading: setlistLoading } = useSetlist(show?.id, user);
  const { userVotes, handleVote } = useVotes(setlist?.id, user);

  const handleSuggest = () => {
    toast({
      title: "Coming Soon",
      description: "Song suggestions will be available soon!"
    });
  };

  if (showLoading || setlistLoading) {
    return <LoadingState />;
  }

  if (!show) {
    return <EmptyState />;
  }

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
          />
        </div>
      </div>
    </div>
  );
}
