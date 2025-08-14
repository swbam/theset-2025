// Enterprise-grade Spotify Artist Songs Sync with advanced rate limiting and batch optimization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import {
  BatchProcessor,
  Logger,
  PerformanceMonitor,
  RetryHandler,
  CircuitBreaker,
  RateLimiter,
  createApiResponse,
  sleep
} from '../_shared/utils.ts';
import type {
  SpotifyTrack,
  SpotifyArtist,
  DatabaseArtist,
  DatabaseSong,
  SyncMetrics,
  SyncJobConfig,
  ApiResponse
} from '../_shared/types.ts';

// Configuration
const SYNC_CONFIG: SyncJobConfig = {
  batchSize: 25,
  maxConcurrency: 3,
  retryAttempts: 3,
  retryDelayMs: 2000,
  timeoutMs: 600000
};

const SPOTIFY_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000,
  retryAfterMs: 1000
};

const MAX_ARTISTS_PER_SYNC = 200;
const STALE_THRESHOLD_DAYS = 3;

// Global instances
const logger = Logger.getInstance().setContext('SPOTIFY_SONGS_SYNC');
const performanceMonitor = new PerformanceMonitor();
const retryHandler = new RetryHandler(3, 2000, 60000);
const circuitBreaker = new CircuitBreaker(3, 120000);
const spotifyRateLimiter = new RateLimiter(SPOTIFY_RATE_LIMIT);

// Spotify Token Manager
class SpotifyTokenManager {
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  constructor(private supabaseClient: any) {}

  async initialize(): Promise<void> {
    this.clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    this.clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!this.clientId || !this.clientSecret) {
      const { data, error } = await this.supabaseClient
        .from('secrets')
        .select('key, value')
        .in('key', ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET']);
      
      if (error) {
        throw new Error(`Failed to load Spotify credentials: ${error.message}`);
      }
      
      const idRow = data?.find((r: any) => r.key === 'SPOTIFY_CLIENT_ID');
      const secretRow = data?.find((r: any) => r.key === 'SPOTIFY_CLIENT_SECRET');
      this.clientId = this.clientId || idRow?.value || null;
      this.clientSecret = this.clientSecret || secretRow?.value || null;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not found');
    }
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
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not initialized');
    }

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
    this.tokenExpiry = Date.now() + ((tokenData.expires_in - 300) * 1000);
  }
}

// Spotify API Client
class SpotifyApiClient {
  constructor(private tokenManager: SpotifyTokenManager) {}

  async getArtistTopTracks(artistId: string): Promise<SpotifyTrack[]> {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const token = await this.tokenManager.getAccessToken();
      
      const response = await retryHandler.execute(async () => {
        const response = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
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
  }

  async getArtistAlbums(artistId: string): Promise<any[]> {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const token = await this.tokenManager.getAccessToken();

      const collected: any[] = [];
      let nextUrl: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?market=US&limit=50&include_groups=album,single`;
      
      while (nextUrl) {
        const response = await retryHandler.execute(async () => {
          const resp = await fetch(nextUrl!, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (resp.status === 429) {
            const retryAfter = resp.headers.get('Retry-After');
            if (retryAfter) await sleep(parseInt(retryAfter) * 1000);
            throw new Error('Rate limited by Spotify API');
          }
          return resp;
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        collected.push(...(data.items || []));
        nextUrl = data.next || null;
      }
      
      return collected;
    });
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    await spotifyRateLimiter.acquire();
    
    return await circuitBreaker.execute(async () => {
      const token = await this.tokenManager.getAccessToken();

      const collected: SpotifyTrack[] = [];
      let nextUrl: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks?market=US&limit=50`;
      
      while (nextUrl) {
        const response = await retryHandler.execute(async () => {
          const resp = await fetch(nextUrl!, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (resp.status === 429) {
            const retryAfter = resp.headers.get('Retry-After');
            if (retryAfter) await sleep(parseInt(retryAfter) * 1000);
            throw new Error('Rate limited by Spotify API');
          }
          return resp;
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        collected.push(...(data.items || []));
        nextUrl = data.next || null;
      }
      
      return collected;
    });
  }
}

// Database Operations Manager
class SongsDatabaseManager {
  constructor(private supabaseClient: any, private targetArtistId?: string) {}

  async getArtistsNeedingSync(): Promise<DatabaseArtist[]> {
    if (this.targetArtistId) {
      const { data: artist, error } = await this.supabaseClient
        .from('artists')
        .select('id, name, spotify_id, last_synced_at, popularity')
        .eq('id', this.targetArtistId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return artist && artist.spotify_id ? [artist] : [];
    }

    const staleDate = new Date(Date.now() - (STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)).toISOString();
    
    const { data: artists, error } = await this.supabaseClient
      .from('artists')
      .select('id, name, spotify_id, last_synced_at, popularity')
      .not('spotify_id', 'is', null)
      .or(`last_synced_at.is.null,last_synced_at.lt.${staleDate}`)
      .limit(MAX_ARTISTS_PER_SYNC);

    if (error) {
      throw error;
    }

    return artists || [];
  }

  async batchUpsertSongs(songs: Partial<DatabaseSong>[]): Promise<DatabaseSong[]> {
    if (songs.length === 0) return [];
    
    const cachedSongs = songs.map(song => ({
      spotify_id: song.spotify_id,
      artist_id: song.artist_id,
      name: song.name,
      album: song.album,
      popularity: song.popularity,
      preview_url: song.preview_url,
      last_synced_at: song.last_synced_at
    }));

    const { data, error } = await this.supabaseClient
      .from('cached_songs')
      .upsert(cachedSongs, {
        onConflict: 'spotify_id,artist_id',
        ignoreDuplicates: false
      })
      .select('id, spotify_id, artist_id, name');

    if (error) {
      throw error;
    }

    return data || [];
  }

  async updateArtistSyncTimestamp(artistId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('artists')
      .update({ 
        last_synced_at: new Date().toISOString()
      })
      .eq('id', artistId);

    if (error) {
      logger.warn('Failed to update artist sync timestamp', { artistId, error });
    }
  }
}

// Data Transformer
class SongDataTransformer {
  static validateAndTransformSong(track: SpotifyTrack, artistId: string): Partial<DatabaseSong> | null {
    if (!track.id || !track.name) {
      return null;
    }

    return {
      spotify_id: track.id,
      artist_id: artistId,
      name: track.name.trim(),
      album: track.album?.name?.trim(),
      preview_url: track.preview_url,
      popularity: track.popularity || 0,
      duration_ms: track.duration_ms || 0,
      explicit: track.explicit || false,
      last_synced_at: new Date().toISOString()
    };
  }

  static deduplicateTracks(tracks: SpotifyTrack[]): SpotifyTrack[] {
    const seen = new Set<string>();
    const deduplicated: SpotifyTrack[] = [];

    for (const track of tracks) {
      const key = `${track.id}-${track.name.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(track);
      }
    }

    return deduplicated;
  }
}

// Main Sync Orchestrator
class ArtistSongsSync {
  private dbManager: SongsDatabaseManager;
  private spotifyClient: SpotifyApiClient;
  private tokenManager: SpotifyTokenManager;

  constructor(private supabaseClient: any, private targetArtistId?: string) {
    this.dbManager = new SongsDatabaseManager(supabaseClient, targetArtistId);
    this.tokenManager = new SpotifyTokenManager(supabaseClient);
    this.spotifyClient = new SpotifyApiClient(this.tokenManager);
  }

  async execute(): Promise<ApiResponse<SyncMetrics>> {
    const startTime = performance.now();
    
    try {
      await this.tokenManager.initialize();
      
      const artists = await this.dbManager.getArtistsNeedingSync();
      
      if (artists.length === 0) {
        return createApiResponse(true, {
          processed: 0,
          errors: 0,
          skipped: 0,
          total: 0,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          executionTimeMs: Math.round(performance.now() - startTime)
        });
      }

      let processedCount = 0;
      let errorCount = 0;

      for (const artist of artists) {
        try {
          await this.processArtist(artist);
          processedCount++;
        } catch (error) {
          errorCount++;
          logger.error(`Failed to process artist ${artist.name}`, { error });
        }
      }

      const executionTime = performance.now() - startTime;
      const metrics: SyncMetrics = {
        processed: processedCount,
        errors: errorCount,
        skipped: 0,
        total: artists.length,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        executionTimeMs: Math.round(executionTime)
      };

      return createApiResponse(true, metrics);

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return createApiResponse(false, undefined, errorMessage, {
        executionTime: Math.round(executionTime)
      });
    }
  }

  private async processArtist(artist: DatabaseArtist): Promise<void> {
    if (!artist.spotify_id) {
      throw new Error('Artist missing Spotify ID');
    }

    const [topTracks, albums] = await Promise.all([
      this.spotifyClient.getArtistTopTracks(artist.spotify_id),
      this.spotifyClient.getArtistAlbums(artist.spotify_id)
    ]);

    const albumTracks: SpotifyTrack[] = [];
    for (const album of albums.slice(0, 10)) { // Limit to 10 albums
      try {
        const tracks = await this.spotifyClient.getAlbumTracks(album.id);
        albumTracks.push(...tracks);
      } catch (error) {
        logger.warn(`Failed to get tracks for album ${album.name}`, { error });
      }
    }

    const allTracks = [...topTracks, ...albumTracks];
    const deduplicatedTracks = SongDataTransformer.deduplicateTracks(allTracks);

    if (deduplicatedTracks.length === 0) {
      await this.dbManager.updateArtistSyncTimestamp(artist.id);
      return;
    }

    const songsToUpsert = deduplicatedTracks
      .map(track => SongDataTransformer.validateAndTransformSong(track, artist.id))
      .filter((song): song is Partial<DatabaseSong> => song !== null);

    await this.dbManager.batchUpsertSongs(songsToUpsert);
    await this.dbManager.updateArtistSyncTimestamp(artist.id);
  }
}

// Main Handler
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targetArtistId: string | undefined;
    try {
      if (req.headers.get('content-type')?.includes('application/json')) {
        const body = await req.json().catch(() => null);
        if (body?.artistId) {
          targetArtistId = body.artistId;
        }
      }
    } catch (_) {
      // Ignore body parse errors
    }

    const syncJob = new ArtistSongsSync(supabaseClient, targetArtistId);
    const result = await syncJob.execute();

    return createCorsResponse(result, result.success ? 200 : 500);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorResponse = createApiResponse(false, undefined, errorMessage);
    return createCorsResponse(errorResponse, 500);
  }
});