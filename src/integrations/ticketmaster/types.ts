
export interface TicketmasterVenue {
  id: string;
  name: string;
  capacity?: number;
  city?: {
    name: string;
    state?: {
      name: string;
      stateCode?: string;
    };
  };
  state?: {
    name: string;
    stateCode?: string;
  };
  country?: {
    name: string;
    countryCode?: string;
  };
  address?: {
    line1: string;
  };
  images?: Array<{
    url: string;
    ratio?: string;
    width?: number;
    height?: number;
  }>;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      dateTime: string;
    };
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: Array<{
      name: string;
      images?: Array<{
        url: string;
      }>;
      classifications?: Array<{
        primary: boolean;
        segment: {
          name: string;
        };
      }>;
    }>;
  };
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
  url: string;
  classifications?: Array<{
    primary: boolean;
    segment: {
      name: string;
    };
  }>;
}

export interface CachedShow {
  ticketmaster_id: string;
  artist_id: string;  // Changed from optional to required to match DB schema
  name: string;
  date: string;
  venue_id?: string;
  venue_name?: string;
  venue_location?: any;
  ticket_url: string;
  last_synced_at: string;
}

export interface CachedVenue {
  ticketmaster_id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  location?: any;
  capacity?: number;
  venue_image_url?: string | null;
  last_synced_at: string;
}

export interface CachedArtist {
  id: string;
  name: string;
  spotify_id: string;
  image_url?: string | null;
  cover_image_url?: string | null;
  genres?: string[] | null;
  popularity?: number | null;
  spotify_data?: any;
  last_synced_at: string;
}

export interface CachedSong {
  id: string;
  spotify_id: string;
  artist_id: string;
  name: string;
  album?: string;
  preview_url?: string;
  popularity?: number;
  last_synced_at: string;
}
