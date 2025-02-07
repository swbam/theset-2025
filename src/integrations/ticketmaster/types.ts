
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
  artist_id?: string | null;
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
  last_synced_at: string;
}

