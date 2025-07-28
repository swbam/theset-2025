import type { Json } from '@/integrations/supabase/types';

export interface TicketmasterArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    ratio?: string;
    width?: number;
    height?: number;
  }>;
  classifications?: Array<{
    primary: boolean;
    segment: {
      name: string;
    };
  }>;
}

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
      id: string;
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
  id: string;
  ticketmaster_id: string;
  artist_id: string;
  name: string;
  date: string;
  venue_name?: string;
  venue_location?: Record<string, any>;
  ticket_url?: string;
  last_synced_at?: string;
  created_at?: string;
}

export interface CachedVenue {
  id: string;
  ticketmaster_id: string;
  name: string;
  metadata: Record<string, any>;
  last_synced_at?: string;
  created_at?: string;
}

export interface CachedArtist {
  id: string;
  name: string;
  spotify_id?: string;
  image_url?: string;
  cover_image_url?: string;
  genres?: string[];
  metadata?: Record<string, any>;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}
