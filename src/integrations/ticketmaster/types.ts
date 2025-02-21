
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
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
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
  classifications?: Array<{
    genre?: {
      name: string;
    };
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
  price_ranges?: any;
  venue?: CachedVenue;
}

export interface CachedVenue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  venue_image_url?: string;
  display_name?: string;
  display_location?: string;
  ticketmaster_id: string;
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
  cover_image_url?: string;
  genres?: string[];
  classifications?: any[];
  ticketmaster_id?: string;
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

export interface ArtistSearchResult {
  name: string;
  image?: string;
  venue?: string;
  date?: string;
  url?: string;
  capacity?: number;
  relevanceScore?: number;
  ticketmaster_id?: string;
  dates?: {
    start: {
      dateTime: string;
    };
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
}
