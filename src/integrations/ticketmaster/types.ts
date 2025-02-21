
export interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  dates: {
    start: {
      dateTime: string;
    };
    status?: {
      code: string;
    };
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
}

export interface TicketmasterVenue {
  id: string;
  name: string;
  city?: {
    name: string;
  };
  state?: {
    name: string;
  };
  country?: {
    name: string;
  };
  address?: {
    line1: string;
  };
  location?: {
    latitude: string;
    longitude: string;
  };
  capacity?: string;
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
  displayName?: string;
  displayLocation?: string;
}

export interface TicketmasterAttraction {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
}

export interface CachedShow {
  id: string;
  ticketmaster_id: string;
  artist_id: string;
  name: string;
  date: string;
  venue_id?: string;
  venue_name?: string;
  venue_location?: string;
  ticket_url?: string;
  status?: string;
  platform_id: string;
  last_synced_at: string;
  venue?: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country?: string;
    capacity?: number;
    venue_image_url?: string;
  };
}

export interface Artist {
  id: string;
  name: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
  image_url?: string;
  spotify_id?: string;
}

export interface CachedSong {
  id: string;
  artist_id: string;
  name: string;
  platform_id: string;
  album?: string;
  popularity?: number;
  preview_url?: string;
  last_synced_at: string;
  spotify_id?: string;
}
