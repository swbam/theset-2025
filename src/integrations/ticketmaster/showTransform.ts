
import type { TicketmasterEvent, CachedShow } from "./types";

export const prepareShowForCache = (show: TicketmasterEvent, artistId?: string | null): Omit<CachedShow, 'venue_id'> | null => {
  if (!show.dates?.start?.dateTime || !artistId) {
    console.log('Skipping show cache - missing required data:', show.id);
    return null;
  }

  const venue = show._embedded?.venues?.[0];
  
  return {
    id: show.id,
    ticketmaster_id: show.id,
    artist_id: artistId,
    name: show.name,
    date: show.dates.start.dateTime,
    venue_name: venue?.name,
    venue_location: venue ? JSON.stringify(venue) : null,
    ticket_url: show.url,
    status: show.dates?.status?.code || null,
    price_ranges: show.priceRanges ? JSON.stringify(show.priceRanges) : null,
    last_synced_at: new Date().toISOString()
  };
};
