
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "../ui/button";
import type { TicketmasterEvent } from "@/integrations/ticketmaster/types";

interface ShowCardProps {
  show: TicketmasterEvent;
}

export const ShowCard = ({ show }: ShowCardProps) => {
  const navigate = useNavigate();
  const artist = show._embedded?.attractions?.[0];
  const venue = show._embedded?.venues?.[0];

  if (!artist?.name || !venue?.name || !show.dates?.start?.dateTime) {
    return null;
  }

  const date = new Date(show.dates.start.dateTime);
  const artistSlug = artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const location = `${venue.city?.name || ''}, ${venue.state?.name || ''}`.trim();
  const dateSlug = date.toISOString().split('T')[0];

  const handleViewSetlist = () => {
    const url = `/artist/${artistSlug}/${location}/${dateSlug}/${show.id}`;
    navigate(url);
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight">
            {artist.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {venue.name}
          </p>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            onClick={handleViewSetlist}
            variant="secondary"
          >
            View Setlist
          </Button>
          {show.url && (
            <Button
              variant="outline"
              onClick={() => window.open(show.url, '_blank')}
            >
              Buy Tickets
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
