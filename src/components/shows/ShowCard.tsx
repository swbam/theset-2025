
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import type { TicketmasterEvent } from "@/integrations/ticketmaster/client";

interface ShowCardProps {
  show: TicketmasterEvent;
  onArtistClick: (artistName: string) => void;
}

export const ShowCard = ({ show, onArtistClick }: ShowCardProps) => {
  const artistName = show._embedded?.attractions?.[0]?.name || show.name;
  const artistImage = show._embedded?.attractions?.[0]?.images?.[0]?.url || show.images?.[0]?.url;
  const venue = show._embedded?.venues?.[0];

  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => onArtistClick(artistName)}>
      <CardHeader className="flex flex-row items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0"
          style={{
            backgroundImage: `url(${artistImage || ''})`,
            backgroundColor: !artistImage ? 'rgba(255,255,255,0.1)' : undefined,
          }}
        />
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{artistName}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            {venue?.name}
            {venue?.city?.name && `, ${venue.city.name}`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {format(new Date(show.dates.start.dateTime), 'EEEE, MMMM d, yyyy')}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            window.open(show.url, '_blank');
          }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Get Tickets
        </Button>
      </CardFooter>
    </Card>
  );
};
