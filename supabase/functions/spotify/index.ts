// Spotify Edge Function for server-side API calls
// Handles artist search, top tracks, and other Spotify API operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import {
  Logger,
  PerformanceMonitor,
  RetryHandler,
  CircuitBreaker,
  RateLimiter,
  createApiResponse,
  sleep
} from '../_shared/utils.ts';

const SPOTIFY_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000,
  retryAfterMs: 1000
};

const logger = Logger.getInstance().setContext('SPOTIFY_API');
const performanceMonitor = new PerformanceMonitor();
const retryHandler = new RetryHandler(3, 2000, 60000);
const circuitBreaker = new CircuitBreaker(3, 120000);
const spotifyRateLimiter = new RateLimiter(SPOTIFY_RATE_LIMIT);

class SpotifyTokenManager {
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    await this.refreshAccessToken();
    
    if (!this.cachedToken) {
      throw new Error('Failed to obtain Spotify access token');
    }

    return this.cachedToken;
  }

  private async refreshAccessToken(): Promise<void> {
    const endTimer = performanceMonitor.startTimer('spotify_token_refresh');
    
    try {
      logger.debug('Refreshing Spotify access token');

      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      
      const response = await retryHandler.execute(async () => {
        return await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          },
          body: 'grant_type=client_credentials'
        });
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify token request failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.access_token) {
        throw new Error('Invalid token response from Spotify');
      }

      this.cachedToken = tokenData.access_token;
      // Set expiry with 5 minute buffer
      this.tokenExpiry = Date.now() + ((tokenData.expires_in - 300) * 1000);

      logger.info('Spotify access token refreshed successfully', {
        expiresIn: tokenData.expires_in
      });
    } finally {
      endTimer();
    }
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    const { action, params } = await req.json();

    logger.info('Spotify API request', { action, params });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credentials, error: credError } = await supabaseClient
      .from('secrets')
      .select('key, value')
      .in('key', ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET']);

    if (credError || !credentials || credentials.length !== 2) {
      throw new Error('Failed to retrieve Spotify credentials from database');
    }

    const clientId = credentials.find(c => c.key === 'SPOTIFY_CLIENT_ID')?.value;
    const clientSecret = credentials.find(c => c.key === 'SPOTIFY_CLIENT_SECRET')?.value;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not found in database');
    }

    const tokenManager = new SpotifyTokenManager(clientId, clientSecret);
    const accessToken = await tokenManager.getAccessToken();

    let result;
    switch (action) {
      case 'searchArtist':
        result = await searchArtist(accessToken, params.artistName);
        break;
      
      case 'getArtistTopTracks':
        result = await getArtistTopTracks(accessToken, params.artistId);
        break;
      
      case 'getArtistDetails':
        result = await getArtistDetails(accessToken, params.artistId);
        break;
      
      case 'searchTracks':
        result = await searchTracks(accessToken, params.query);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const totalTime = performance.now() - startTime;
    const response = createApiResponse(true, result, undefined, {
      executionTime: Math.round(totalTime)
    });

    return createCorsResponse(response, 200);

  } catch (error) {
    const totalTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    logger.error('Spotify API error', {
      error: errorMessage,
      executionTime: totalTime
    });

    const errorResponse = createApiResponse(false, undefined, errorMessage, {
      executionTime: totalTime
    });

    return createCorsResponse(errorResponse, 500);
  }
});

// API Functions
async function searchArtist(accessToken: string, artistName: string) {
  const endTimer = performanceMonitor.startTimer('spotify_search_artist');
  
  try {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const response = await retryHandler.execute(async () => {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            await sleep(parseInt(retryAfter) * 1000);
          }
          throw new Error('Rate limited by Spotify API');
        }
        
        return response;
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.artists?.items?.[0] || null;
    });
  } finally {
    endTimer();
  }
}

async function getArtistTopTracks(accessToken: string, artistId: string) {
  const endTimer = performanceMonitor.startTimer('spotify_get_top_tracks');
  
  try {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const response = await retryHandler.execute(async () => {
        const response = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            await sleep(parseInt(retryAfter) * 1000);
          }
          throw new Error('Rate limited by Spotify API');
        }
        
        return response;
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.tracks || [];
    });
  } finally {
    endTimer();
  }
}

async function getArtistDetails(accessToken: string, artistId: string) {
  const endTimer = performanceMonitor.startTimer('spotify_get_artist_details');
  
  try {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const response = await retryHandler.execute(async () => {
        const response = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            await sleep(parseInt(retryAfter) * 1000);
          }
          throw new Error('Rate limited by Spotify API');
        }
        
        return response;
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    });
  } finally {
    endTimer();
  }
}

async function searchTracks(accessToken: string, query: string) {
  const endTimer = performanceMonitor.startTimer('spotify_search_tracks');
  
  try {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const response = await retryHandler.execute(async () => {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            await sleep(parseInt(retryAfter) * 1000);
          }
          throw new Error('Rate limited by Spotify API');
        }
        
        return response;
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.tracks?.items || [];
    });
  } finally {
    endTimer();
  }
}