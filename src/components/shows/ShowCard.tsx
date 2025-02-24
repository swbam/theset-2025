import { Button } from "../../components/ui/button";
import { Calendar } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent } from "../../components/ui/card";
import type { TicketmasterEvent, CachedShow, TicketmasterVenue, CachedVenue } from "../../integrations/ticketmaster/types";
import { useNavigate } from "react-router-dom";

interface ShowCardProps {
  show: TicketmasterEvent | CachedShow;
}

interface VenueLocation {
  city?: {
    name: string;
  };
  state?: {
    name: string;
  };
  name?: string;
  displayName?: string;
  displayLocation?: string;
}

export const ShowCard = ({ show }: ShowCardProps) => {
  const navigate = useNavigate();
  const isTicketmasterEvent = 'dates' in show;
  
  // Handle date parsing more carefully
  const showDate = (() => {
    try {
      // For Ticketmaster events
      if (isTicketmasterEvent) {
        // Check if it's a multi-day event (like festivals)
        if (show.name.toLowerCase().includes('day pass') || 
            show.name.toLowerCase().includes('weekend')) {
          // For multi-day events, use the start date if available
          if (show.dates?.start?.dateTime) {
            const date = new Date(show.dates.start.dateTime);
            if (isValid(date)) return date;
          }
          // If no start date, create a future date for sorting
          return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        }
        
        // Regular event
        const date = new Date(show.dates.start.dateTime);
        if (isValid(date)) return date;
      } else {
        // For cached shows
        const date = parseISO(show.date);
        if (isValid(date)) return date;
      }
      
      // If we get here, try parsing as a fallback
      const fallbackDate = new Date(isTicketmasterEvent ? show.dates.start.dateTime : show.date);
      if (isValid(fallbackDate)) return fallbackDate;
      
      console.error('Invalid date format for show:', show.name, isTicketmasterEvent ? show.dates.start.dateTime : show.date);
      return null;
    } catch (error) {
      console.error('Error parsing date for show:', show.name, error);
      return null;
    }
  })();

  // Get venue information
  const venue = isTicketmasterEvent 
    ? show._embedded?.venues?.[0] 
    : show.venue;

  // Get artist name from the show data
  const artistName = isTicketmasterEvent ? show._embedded?.attractions?.[0]?.name : show.name?.split(' at ')?.[0];
  
  // Use the display info provided by the Edge Function if available
  const venueName = isTicketmasterEvent 
    ? (venue as TicketmasterVenue)?.displayName || venue?.name || ''
    : venue?.name || show.venue_name || '';

  const cityState = isTicketmasterEvent
    ? (venue as TicketmasterVenue)?.displayLocation || (() => {
        if (!venue) return '';
        const tmVenue = venue as TicketmasterVenue;
        const city = tmVenue.city?.name || '';
        const state = tmVenue.state?.name || '';
        return city && state ? `${city}, ${state}` : city;
      })()
    : (() => {
        if (!venue) return show.venue_location || '';
        const cachedVenue = venue as CachedVenue;
        return cachedVenue.city && cachedVenue.state 
          ? `${cachedVenue.city}, ${cachedVenue.state}` 
          : cachedVenue.city || '';
      })();

  const generateSeoUrl = () => {
    if (!artistName) return '/';

    // Format the date for the URL
    const dateStr = showDate ? format(showDate, 'yyyy-MM-dd') : 'upcoming';
    
    // Format the location for the URL
    const location = cityState.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')             // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
      || 'venue';

    // Format the artist name
    const encodedName = artistName.split(':')[0].toLowerCase() // Extract artist name before the colon
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const eventId = isTicketmasterEvent ? show.id : show.ticketmaster_id;

    return `/artist/${encodedName}/${location}/${dateStr}/${eventId}`;
  };

  // For multi-day events, show a special date display
  const isMultiDayEvent = show.name.toLowerCase().includes('day pass') || 
                         show.name.toLowerCase().includes('weekend');

  return (
    <Card className="bg-black/30 hover:bg-black/40 transition-colors border-white/10">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-white text-lg">{artistName}</h3>
              <div className="space-y-1">
                {venueName && (
                  <p className="text-white/60 line-clamp-1" title={venueName}>
                    {venueName}
                  </p>
                )}
                {cityState && (
                  <p className="text-white/60 line-clamp-1" title={cityState}>
                    {cityState}
                  </p>
                )}
              </div>
            </div>
            {showDate && !isMultiDayEvent && (
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  {format(showDate, 'MMM')}
                </div>
                <div className="text-2xl font-bold text-white">
                  {format(showDate, 'd')}
                </div>
              </div>
            )}
          </div>
          
          {showDate && !isMultiDayEvent && (
            <div className="text-sm text-white/60">
              {format(showDate, 'EEEE')} • {format(showDate, 'h:mm a')}
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full hover:bg-white/10 hover:text-white" 
            onClick={e => {
              e.stopPropagation();
              navigate(generateSeoUrl());
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
