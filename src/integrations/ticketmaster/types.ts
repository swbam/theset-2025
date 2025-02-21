
import { Json } from "../supabase/types";

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
  type: string;
}

export interface TicketmasterVenue {
  id: string;
  name: string;
  capacity?: string; // Changed from number to string since API returns it as string
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
  displayName?: string;
  displayLocation?: string;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
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
    attractions?: Array<{
      id?: string;
      name: string;
      images?: Array<{
        url: string;
      }>;
      classifications?: Array<{
        primary: boolean;
        segment: {
          name: string;
        };
        genre?: {
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
  priceRanges?: PriceRange[];
  classifications?: Array<{
    primary: boolean;
    segment: {
      name: string;
    };
  }>;
}

export interface CachedVenue {
  id: string;
  ticketmaster_id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  capacity?: number;
  venue_image_url?: string | null;
  last_synced_at: string;
  displayName?: string;
  displayLocation?: string;
}

export interface CachedShow {
  id: string;
  ticketmaster_id: string;
  artist_id: string;
  name: string;
  date: string;
  venue_id?: string;
  venue?: CachedVenue;
  venue_name?: string;
  venue_location?: string;
  ticket_url: string;
  status?: string | null;
  price_ranges?: PriceRange[];
  last_synced_at: string;
  platform_id: string;
}

export interface Artist {
  id: string;
  name: string;
  spotify_id?: string | null;
  ticketmaster_id?: string | null;
  ticketmaster_data?: Json | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  genres?: string[] | null;
  popularity?: number | null;
  spotify_data?: Json | null;
  metadata?: Json | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

export interface CachedSong {
  id: string;
  platform_id: string;
  artist_id: string;
  name: string;
  album?: string;
  preview_url?: string;
  popularity?: number;
  last_synced_at: string;
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
}

export interface UserArtist {
  id: string;
  user_id: string;
  artist_id: string;
  created_at: string;
  artists: {
    id: string;
    name: string;
    image_url: string | null;
    genres: string[] | null;
  };
}
