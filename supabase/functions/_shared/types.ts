// Enterprise-grade TypeScript definitions for TheSet sync system

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  executionTime?: number;
  rateLimitRemaining?: number;
}

export interface SyncMetrics {
  processed: number;
  errors: number;
  skipped: number;
  total: number;
  startTime: string;
  endTime: string;
  executionTimeMs: number;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      dateTime: string;
      localDate: string;
      localTime: string;
    };
  };
  url: string;
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterArtist[];
  };
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
  city?: {
    name: string;
  };
  state?: {
    name: string;
    stateCode: string;
  };
  country?: {
    name: string;
    countryCode: string;
  };
  address?: {
    line1: string;
  };
  location?: {
    latitude: string;
    longitude: string;
  };
  timezone?: string;
  capacity?: number;
}

export interface TicketmasterArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  classifications?: Array<{
    genre: {
      name: string;
    };
    subGenre: {
      name: string;
    };
  }>;
  externalLinks?: {
    spotify?: Array<{
      url: string;
    }>;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  preview_url: string | null;
  duration_ms: number;
  explicit: boolean;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    release_date: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  followers: {
    total: number;
  };
  genres: string[];
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface DatabaseArtist {
  id: string;
  name: string;
  spotify_id?: string;
  ticketmaster_id?: string;
  image_url?: string;
  genres?: string[];
  popularity?: number;
  metadata?: any;
  last_synced_at?: string;
  created_at: string;
}

export interface DatabaseVenue {
  id: string;
  name: string;
  ticketmaster_id: string;
  city?: string;
  state?: string;
  country?: string;
  metadata?: any;
  last_synced_at?: string;
  created_at: string;
}

export interface DatabaseShow {
  id: string;
  ticketmaster_id: string;
  artist_id?: string;
  venue_id?: string;
  name: string;
  date: string;
  venue_name?: string;
  venue_location?: any;
  ticket_url?: string;
  last_synced_at?: string;
  created_at: string;
}

export interface DatabaseSong {
  id: string;
  spotify_id: string;
  artist_id: string;
  name: string;
  album?: string;
  preview_url?: string;
  popularity?: number;
  duration_ms?: number;
  explicit?: boolean;
  metadata?: any;
  last_synced_at?: string;
  created_at: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

export interface SyncJobConfig {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  lastCheck: string;
}