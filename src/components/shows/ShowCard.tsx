import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ShowCardProps {
  show: any; // Use any for flexibility with different show data structures
  onClick: () => void;
}

export const ShowCard = ({ show, onClick }: ShowCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Date TBA';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Handle different show data structures
  const showName = show.name || show.title || 'Untitled Show';
  const showDate = show.date || show.dates?.start?.dateTime || show.dates?.start?.localDate;
  const venueName = show.venue_name || show._embedded?.venues?.[0]?.name || show.venue?.name;
  const artistName = show.artist?.name || show._embedded?.attractions?.[0]?.name;
  const showImage = show.image || show.images?.[0]?.url || show._embedded?.venues?.[0]?.images?.[0]?.url;
  const ticketUrl = show.ticket_url || show.url;

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:scale-105 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {showImage && (
          <div 
            className="w-full h-48 bg-cover bg-center rounded-t-lg"
            style={{ backgroundImage: `url(${showImage})` }}
          />
        )}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
              {showName}
            </h3>
            {artistName && (
              <p className="text-sm text-zinc-400 mt-1">{artistName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            {showDate && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(showDate)}</span>
                {formatTime(showDate) && (
                  <>
                    <span>•</span>
                    <span>{formatTime(showDate)}</span>
                  </>
                )}
              </div>
            )}
            
            {venueName && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{venueName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Vote on setlist
            </Badge>
            {ticketUrl && (
              <a 
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Get tickets
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};