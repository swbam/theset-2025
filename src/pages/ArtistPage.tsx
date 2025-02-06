
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ArtistPage() {
  const { artistName } = useParams();
  
  const { data: shows, isLoading } = useQuery({
    queryKey: ['artistShows', artistName],
    queryFn: () => fetchArtistEvents(artistName || ''),
    enabled: !!artistName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">{artistName}</h1>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Upcoming Shows</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shows?.map((show) => (
            <Card key={show.name + show.dates.start.dateTime}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{show.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {show._embedded?.venues?.[0]?.name}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(show.dates.start.dateTime), 'EEEE, MMMM d, yyyy')}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(show.url, '_blank')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Get Tickets
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
