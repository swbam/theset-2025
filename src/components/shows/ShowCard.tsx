
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "../ui/button";
import type { ShowCardProps } from "@/types/show";

export const ShowCard = ({ show }: ShowCardProps) => {
  const navigate = useNavigate();
  const venue = show.venue || {
    name: show.venue_name || 'Unknown Venue',
    city: show.venue_location?.split(',')[0],
    state: show.venue_location?.split(',')[1]?.trim()
  };

  if (!show.date) {
    return null;
  }

  const date = new Date(show.date);
  const artistName = show.artist?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
  const location = venue.city;
  const dateSlug = date.toISOString().split('T')[0];

  const handleViewSetlist = () => {
    const url = `/artist/${artistName}/${location}/${dateSlug}/${show.platform_id}`;
    navigate(url);
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight">
            {show.artist?.name}
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
          {show.ticket_url && (
            <Button
              variant="outline"
              onClick={() => window.open(show.ticket_url, '_blank')}
            >
              Buy Tickets
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
