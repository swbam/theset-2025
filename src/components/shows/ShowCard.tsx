
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import type { TicketmasterEvent } from "@/integrations/ticketmaster/client";
import { useNavigate } from "react-router-dom";

interface ShowCardProps {
  show: TicketmasterEvent;
  onArtistClick?: (artistName: string) => void;
}

export const ShowCard = ({ show, onArtistClick }: ShowCardProps) => {
  const navigate = useNavigate();
  const venue = show._embedded?.venues?.[0];
  const showDate = new Date(show.dates.start.dateTime);
  const cityState = venue?.city?.name && venue?.state?.name ? 
    `${venue.city.name}, ${venue.state.name}` : 
    venue?.city?.name || '';

  return (
    <Card className="bg-black/30 hover:bg-black/40 transition-colors border-white/10">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-white">{show.name}</h3>
              <div className="space-y-1">
                <p className="text-white/60">{venue?.name}</p>
                {cityState && <p className="text-white/60">{cityState}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {format(showDate, 'MMM')}
              </div>
              <div className="text-4xl font-bold text-white">
                {format(showDate, 'd')}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-white/60">
            {format(showDate, 'EEEE')} • {format(showDate, 'h:mm a')}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/show/${show.id}`);
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            View Setlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
