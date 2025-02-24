
import { useParams } from "react-router-dom";
import { useShow } from "@/hooks/useShow";
import { useSetlist } from "@/hooks/useSetlist";
import { useAuth } from "@/contexts/AuthContext";
import { Setlist } from "@/components/shows/Setlist";
import { ShowDetails } from "@/components/shows/ShowDetails";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { LoadingState } from "@/components/shows/LoadingState";
import type { BreadcrumbsProps, AddSongParams } from "@/integrations/supabase/types";

const ShowPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { data: show, isLoading: isLoadingShow } = useShow(eventId);
  const { data: setlist, addSong, isLoading: isLoadingSetlist } = useSetlist(show?.id, user);

  if (isLoadingShow || isLoadingSetlist) {
    return <LoadingState />;
  }

  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl font-bold mb-4">Show not found</h1>
        <p className="text-muted-foreground">
          The show you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const artist = show.artist;
  const breadcrumbItems: BreadcrumbsProps['items'] = [
    { label: "Shows", href: "/" },
    { label: artist?.name || "Unknown Artist", href: `/artist/${artist?.name?.toLowerCase()}` },
    { label: "Show Details", href: "#" }
  ];

  const handleSuggest = async (songName: string) => {
    if (setlist?.id) {
      await addSong({
        setlistId: setlist.id,
        songName,
        isTopTrack: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Breadcrumbs items={breadcrumbItems} />
      
      <ShowDetails 
        name={show.name}
        date={show.date}
        venue={{
          name: show.venue?.name || show.venue_name || 'Unknown Venue',
          city: show.venue?.city || show.venue_location?.split(',')[0],
          state: show.venue?.state || show.venue_location?.split(',')[1]?.trim()
        }}
        ticket_url={show.ticket_url}
      />

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <Setlist
          setlist={setlist}
          user={user}
          onSuggest={handleSuggest}
          artistName={artist?.name}
          artistId={artist?.id}
        />
      </div>
    </div>
  );
};

export default ShowPage;
