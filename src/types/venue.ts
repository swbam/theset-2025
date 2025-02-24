
export interface CachedVenue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  venue_image_url?: string | null;
  display_name?: string;
  display_location?: string;
  ticketmaster_id: string;
}
