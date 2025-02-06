
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import type { TicketmasterEvent } from "@/integrations/ticketmaster/client";

interface ShowCardProps {
  show: TicketmasterEvent;
  onArtistClick?: (artistName: string) => void;
}

export const ShowCard = ({ show, onArtistClick }: ShowCardProps) => {
  const venue = show._embedded?.venues?.[0];
  const showDate = new Date(show.dates.start.dateTime);
  const cityState = venue?.city?.name && venue?.state?.name ? 
    `${venue.city.name}, ${venue.state.name}` : 
    venue?.city?.name || '';

  return (
    <Card className="bg-black/30 hover:bg-black/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-1">{show.name}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{venue?.name}</p>
                {cityState && <p>{cityState}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {format(showDate, 'MMM')}
              </div>
              <div className="text-3xl font-bold">
                {format(showDate, 'd')}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {format(showDate, 'EEEE')} • {format(showDate, 'h:mm a')}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              window.open(show.url, '_blank');
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Get Tickets
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
