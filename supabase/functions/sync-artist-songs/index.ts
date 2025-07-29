// Enterprise-grade Spotify Artist Songs Sync with advanced rate limiting and batch optimization
// Handles intelligent caching, token management, and comprehensive error recovery

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
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

// Advanced Configuration
const SYNC_CONFIG: SyncJobConfig = {
  batchSize: 25,
  maxConcurrency: 3, // Conservative for Spotify API
  retryAttempts: 3,
  retryDelayMs: 2000,
  timeoutMs: 600000 // 10 minutes
};

const SPOTIFY_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  retryAfterMs: 1000
};

const MAX_ARTISTS_PER_SYNC = 200;
const TRACKS_PER_ARTIST = 50; // Get more than top 10 for better catalog
const STALE_THRESHOLD_DAYS = 3; // Refresh artist data every 3 days

// Global instances
const logger = Logger.getInstance().setContext('SPOTIFY_SONGS_SYNC');
const performanceMonitor = new PerformanceMonitor();
const retryHandler = new RetryHandler(3, 2000, 60000);
const circuitBreaker = new CircuitBreaker(3, 120000); // More sensitive for external API
const spotifyRateLimiter = new RateLimiter(SPOTIFY_RATE_LIMIT);

// Enhanced Spotify Token Manager
class SpotifyTokenManager {
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  constructor(private supabaseClient: SupabaseClient) {}

  async initialize(): Promise<void> {
    const endTimer = performanceMonitor.startTimer('spotify_credentials_fetch');
    
    try {
      // Get credentials from environment variables (Supabase secrets)
      this.clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      this.clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

      if (!this.clientId || !this.clientSecret) {
        throw new Error('Spotify credentials not found in environment variables');
      }

      logger.info('Spotify credentials initialized successfully');
    } finally {
      endTimer();
    }
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    // Get new token
    await this.refreshAccessToken();
    
    if (!this.cachedToken) {
      throw new Error('Failed to obtain Spotify access token');
    }

    return this.cachedToken;
  }

  private async refreshAccessToken(): Promise<void> {
    const endTimer = performanceMonitor.startTimer('spotify_token_refresh');
    
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Spotify credentials not initialized');
      }

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

// Advanced Spotify API Client
class SpotifyApiClient {
  constructor(private tokenManager: SpotifyTokenManager) {}

  async getArtistTopTracks(artistId: string): Promise<SpotifyTrack[]> {
    const endTimer = performanceMonitor.startTimer('spotify_get_top_tracks');
    
    try {
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
    } finally {
      endTimer();
    }
  }

  async getArtistAlbums(artistId: string): Promise<any[]> {
    const endTimer = performanceMonitor.startTimer('spotify_get_albums');
    
    try {
      await spotifyRateLimiter.acquire();
      
      return await circuitBreaker.execute(async () => {
        const token = await this.tokenManager.getAccessToken();
        
        const response = await retryHandler.execute(async () => {
          const response = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}/albums?market=US&limit=50&include_groups=album,single`,
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
        return data.items || [];
      });
    } finally {
      endTimer();
    }
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const endTimer = performanceMonitor.startTimer('spotify_get_album_tracks');
    
    try {
      await spotifyRateLimiter.acquire();
      
      return await circuitBreaker.execute(async () => {
        const token = await this.tokenManager.getAccessToken();
        
        const response = await retryHandler.execute(async () => {
          const response = await fetch(
            `https://api.spotify.com/v1/albums/${albumId}/tracks?market=US&limit=50`,
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
        return data.items || [];
      });
    } finally {
      endTimer();
    }
  }

  async getArtistDetails(artistId: string): Promise<SpotifyArtist | null> {
    const endTimer = performanceMonitor.startTimer('spotify_get_artist_details');
    
    try {
      await spotifyRateLimiter.acquire();
      
      return await circuitBreaker.execute(async () => {
        const token = await this.tokenManager.getAccessToken();
        
        const response = await retryHandler.execute(async () => {
          const response = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}`,
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
          if (response.status === 404) {
            return null; // Artist not found
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
}

// Database Operations Manager
class SongsDatabaseManager {
  constructor(private supabaseClient: SupabaseClient) {}

  async getArtistsNeedingSync(): Promise<DatabaseArtist[]> {
    const endTimer = performanceMonitor.startTimer('get_artists_needing_sync');
    
    try {
      const staleDate = new Date(Date.now() - (STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)).toISOString();
      
      const { data: artists, error } = await this.supabaseClient
        .from('artists')
        .select('id, name, spotify_id, last_synced_at, popularity')
        .not('spotify_id', 'is', null)
        .or(`last_synced_at.is.null,last_synced_at.lt.${staleDate}`)
        .order('popularity', { ascending: false, nullsLast: true })
        .limit(MAX_ARTISTS_PER_SYNC);

      if (error) {
        logger.error('Failed to fetch artists needing sync', { error });
        throw error;
      }

      logger.info(`Found ${artists?.length || 0} artists needing song sync`);
      return artists || [];
    } finally {
      endTimer();
    }
  }

  async batchUpsertSongs(songs: Partial<DatabaseSong>[]): Promise<DatabaseSong[]> {
    if (songs.length === 0) return [];
    
    const endTimer = performanceMonitor.startTimer('batch_upsert_songs');
    
    try {
      logger.debug(`Batch upserting ${songs.length} songs`);
      
      // Prepare data for both tables
      const cachedSongs = songs.map(song => ({
        spotify_id: song.spotify_id,
        artist_id: song.artist_id,
        name: song.name,
        album: song.album,
        popularity: song.popularity,
        preview_url: song.preview_url,
        last_synced_at: song.last_synced_at
      }));

      const mainSongs = songs.map(song => ({
        spotify_id: song.spotify_id,
        artist_id: song.artist_id,
        title: song.name
      }));

      // Insert to both tables in parallel
      const [cachedResult, mainResult] = await Promise.allSettled([
        this.supabaseClient
          .from('cached_songs')
          .upsert(cachedSongs, {
            onConflict: 'spotify_id,artist_id',
            ignoreDuplicates: false
          })
          .select('id, spotify_id, artist_id, name'),
        this.supabaseClient
          .from('songs')
          .upsert(mainSongs, {
            onConflict: 'spotify_id,artist_id',
            ignoreDuplicates: false
          })
          .select('id, spotify_id, artist_id, title')
      ]);

      let finalData: any[] = [];
      
      if (cachedResult.status === 'fulfilled' && !cachedResult.value.error) {
        finalData = cachedResult.value.data || [];
      } else if (cachedResult.status === 'rejected') {
        logger.error('Failed to upsert cached songs', { error: cachedResult.reason, count: songs.length });
      }

      if (mainResult.status === 'rejected') {
        logger.warn('Failed to upsert main songs table', { error: mainResult.reason });
      } else {
        logger.debug('Successfully upserted to main songs table');
      }

      logger.debug(`Successfully upserted ${finalData.length} songs`);
      return finalData;
    } finally {
      endTimer();
    }
  }

  async updateArtistSyncTimestamp(artistId: string): Promise<void> {
    const endTimer = performanceMonitor.startTimer('update_artist_sync_timestamp');
    
    try {
      const { error } = await this.supabaseClient
        .from('artists')
        .update({ 
          last_synced_at: new Date().toISOString()
        })
        .eq('id', artistId);

      if (error) {
        logger.warn('Failed to update artist sync timestamp', { artistId, error });
      }
    } finally {
      endTimer();
    }
  }

  async updateSyncMetrics(metrics: Partial<SyncMetrics>): Promise<void> {
    try {
      await this.supabaseClient
        .from('sync_events')
        .insert({
          event_type: 'artist_songs_sync',
          status: metrics.errors && metrics.errors > 0 ? 'failed' : 'success',
          metadata: metrics,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('Failed to update sync metrics', { error });
    }
  }
}

// Data Transformer and Validator
class SongDataTransformer {
  static validateAndTransformSong(track: SpotifyTrack, artistId: string): Partial<DatabaseSong> | null {
    if (!track.id || !track.name) {
      logger.warn('Invalid track data - missing required fields', { track });
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
      metadata: {
        spotify: track,
        album: track.album,
        external_urls: track.external_urls
      },
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

    logger.debug(`Deduplicated tracks: ${tracks.length} -> ${deduplicated.length}`);
    return deduplicated;
  }

  static prioritizeTracks(tracks: SpotifyTrack[]): SpotifyTrack[] {
    return tracks
      .sort((a, b) => {
        // Sort by popularity, then by release date (newer first)
        if (b.popularity !== a.popularity) {
          return b.popularity - a.popularity;
        }
        
        const dateA = new Date(a.album?.release_date || '1970-01-01');
        const dateB = new Date(b.album?.release_date || '1970-01-01');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, TRACKS_PER_ARTIST);
  }
}

// Main Artist Processing Result
interface ArtistProcessingResult {
  artistId: string;
  artistName: string;
  success: boolean;
  songsProcessed: number;
  error?: string;
  executionTime: number;
}

// Main Sync Orchestrator
class ArtistSongsSync {
  private state = {
    totalArtists: 0,
    processedArtists: 0,
    successfulArtists: 0,
    failedArtists: 0,
    totalSongs: 0,
    processedSongs: 0,
    errors: [] as string[],
    startTime: new Date().toISOString()
  };

  private dbManager: SongsDatabaseManager;
  private spotifyClient: SpotifyApiClient;
  private tokenManager: SpotifyTokenManager;

  constructor(private supabaseClient: SupabaseClient) {
    this.dbManager = new SongsDatabaseManager(supabaseClient);
    this.tokenManager = new SpotifyTokenManager(supabaseClient);
    this.spotifyClient = new SpotifyApiClient(this.tokenManager);
  }

  async execute(): Promise<ApiResponse<SyncMetrics>> {
    const startTime = performance.now();
    logger.info('Starting artist songs sync job');

    try {
      // Initialize Spotify token manager
      await this.tokenManager.initialize();

      // Get artists needing sync
      const artists = await this.dbManager.getArtistsNeedingSync();
      this.state.totalArtists = artists.length;

      if (artists.length === 0) {
        logger.info('No artists found needing song sync');
        return createApiResponse(true, {
          processed: 0,
          errors: 0,
          skipped: 0,
          total: 0,
          startTime: this.state.startTime,
          endTime: new Date().toISOString(),
          executionTimeMs: Math.round(performance.now() - startTime)
        });
      }

      logger.info(`Processing ${artists.length} artists for song sync`);

      // Process artists in batches
      await this.processArtistsInBatches(artists);

      // Calculate final metrics
      const executionTime = performance.now() - startTime;
      const metrics: SyncMetrics = {
        processed: this.state.processedArtists,
        errors: this.state.failedArtists,
        skipped: 0,
        total: this.state.totalArtists,
        startTime: this.state.startTime,
        endTime: new Date().toISOString(),
        executionTimeMs: Math.round(executionTime)
      };

      await this.dbManager.updateSyncMetrics(metrics);

      logger.info('Artist songs sync completed successfully', {
        ...metrics,
        totalSongs: this.state.totalSongs,
        processedSongs: this.state.processedSongs
      });

      return createApiResponse(true, metrics, undefined, {
        songsProcessed: this.state.processedSongs,
        songsTotal: this.state.totalSongs,
        circuitBreakerState: circuitBreaker.getState().state,
        rateLimitTokens: spotifyRateLimiter.getAvailableTokens()
      });

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Artist songs sync failed', {
        error: errorMessage,
        executionTime: Math.round(executionTime),
        state: this.state
      });

      const metrics: SyncMetrics = {
        processed: this.state.processedArtists,
        errors: this.state.failedArtists + 1,
        skipped: 0,
        total: this.state.totalArtists,
        startTime: this.state.startTime,
        endTime: new Date().toISOString(),
        executionTimeMs: Math.round(executionTime)
      };

      await this.dbManager.updateSyncMetrics(metrics);

      return createApiResponse(false, metrics, errorMessage);
    }
  }

  private async processArtistsInBatches(artists: DatabaseArtist[]): Promise<void> {
    const batchProcessor = new BatchProcessor<DatabaseArtist, ArtistProcessingResult>(SYNC_CONFIG);

    const results = await batchProcessor.processBatch(
      artists,
      (artist) => this.processArtist(artist),
      (processed, total) => {
        this.state.processedArtists = processed;
        if (processed % 10 === 0 || processed === total) {
          logger.info(`Progress: ${processed}/${total} artists processed`);
        }
      }
    );

    // Aggregate results
    const successful = results.filter(r => r.result?.success);
    const failed = results.filter(r => r.error || !r.result?.success);

    this.state.successfulArtists = successful.length;
    this.state.failedArtists = failed.length;

    // Calculate total songs processed
    this.state.processedSongs = successful.reduce((sum, r) => sum + (r.result?.songsProcessed || 0), 0);

    // Log persistent errors
    failed.forEach(failure => {
      const errorMsg = failure.error?.message || failure.result?.error || 'Unknown error';
      this.state.errors.push(errorMsg);
      if (this.state.errors.length <= 5) { // Limit error logging
        logger.warn('Artist processing failed', {
          artistId: failure.item.id,
          artistName: failure.item.name,
          error: errorMsg
        });
      }
    });
  }

  private async processArtist(artist: DatabaseArtist): Promise<ArtistProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!artist.spotify_id) {
        throw new Error('Artist missing Spotify ID');
      }

      logger.debug(`Processing songs for artist: ${artist.name}`);

      // Get comprehensive song data
      const [topTracks, albums] = await Promise.all([
        this.spotifyClient.getArtistTopTracks(artist.spotify_id),
        this.spotifyClient.getArtistAlbums(artist.spotify_id)
      ]);

      // Get additional tracks from albums (limited to avoid rate limits)
      const albumTracks: SpotifyTrack[] = [];
      const popularAlbums = albums.slice(0, 5); // Process only the 5 most recent albums

      for (const album of popularAlbums) {
        try {
          const tracks = await this.spotifyClient.getAlbumTracks(album.id);
          albumTracks.push(...tracks);
        } catch (error) {
          logger.warn(`Failed to get tracks for album ${album.name}`, { error });
        }
      }

      // Combine and process all tracks
      const allTracks = [...topTracks, ...albumTracks];
      const deduplicatedTracks = SongDataTransformer.deduplicateTracks(allTracks);
      const prioritizedTracks = SongDataTransformer.prioritizeTracks(deduplicatedTracks);

      this.state.totalSongs += prioritizedTracks.length;

      if (prioritizedTracks.length === 0) {
        logger.warn(`No tracks found for artist: ${artist.name}`);
        await this.dbManager.updateArtistSyncTimestamp(artist.id);
        return {
          artistId: artist.id,
          artistName: artist.name,
          success: true,
          songsProcessed: 0,
          executionTime: performance.now() - startTime
        };
      }

      // Transform tracks to database format
      const songsToUpsert = prioritizedTracks
        .map(track => SongDataTransformer.validateAndTransformSong(track, artist.id))
        .filter((song): song is Partial<DatabaseSong> => song !== null);

      // Batch upsert songs
      const upsertedSongs = await this.dbManager.batchUpsertSongs(songsToUpsert);

      // Update artist sync timestamp
      await this.dbManager.updateArtistSyncTimestamp(artist.id);

      logger.debug(`Successfully processed ${upsertedSongs.length} songs for ${artist.name}`);

      return {
        artistId: artist.id,
        artistName: artist.name,
        success: true,
        songsProcessed: upsertedSongs.length,
        executionTime: performance.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      logger.debug('Artist processing failed', { 
        artistId: artist.id, 
        artistName: artist.name, 
        error: errorMessage 
      });

      return {
        artistId: artist.id,
        artistName: artist.name,
        success: false,
        songsProcessed: 0,
        error: errorMessage,
        executionTime: performance.now() - startTime
      };
    }
  }
}

// Main Deno.serve Handler
Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = performance.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    logger.info('Artist songs sync job initiated');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Execute sync
    const syncJob = new ArtistSongsSync(supabaseClient);
    const result = await syncJob.execute();

    const totalTime = performance.now() - startTime;
    result.executionTime = Math.round(totalTime);

    logger.info('Artist songs sync job completed', {
      success: result.success,
      executionTime: totalTime
    });

    return createCorsResponse(result, result.success ? 200 : 500);

  } catch (error) {
    const totalTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    logger.error('Sync job handler error', {
      error: errorMessage,
      executionTime: totalTime
    });

    const errorResponse = createApiResponse(false, undefined, errorMessage, {
      executionTime: totalTime
    });

    return createCorsResponse(errorResponse, 500);
  }
});