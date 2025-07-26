// Enterprise-grade Popular Tours Sync with intelligent batching and optimization
// Handles concurrent data processing with fault tolerance and performance monitoring

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import {
  BatchProcessor,
  Logger,
  PerformanceMonitor,
  RetryHandler,
  CircuitBreaker,
  createApiResponse,
  sleep
} from '../_shared/utils.ts';
import type {
  TicketmasterEvent,
  TicketmasterVenue,
  TicketmasterArtist,
  DatabaseArtist,
  DatabaseVenue,
  DatabaseShow,
  SyncMetrics,
  SyncJobConfig,
  ApiResponse
} from '../_shared/types.ts';

// Configuration
const SYNC_CONFIG: SyncJobConfig = {
  batchSize: 20,
  maxConcurrency: 5,
  retryAttempts: 3,
  retryDelayMs: 1000,
  timeoutMs: 300000 // 5 minutes
};

const MAX_EVENTS_TO_PROCESS = 500;
const POPULARITY_THRESHOLD = 10; // Minimum popularity score

// Global instances
const logger = Logger.getInstance().setContext('POPULAR_TOURS_SYNC');
const performanceMonitor = new PerformanceMonitor();
const retryHandler = new RetryHandler(3, 1000, 30000);
const circuitBreaker = new CircuitBreaker(5, 60000);

// Enhanced Data Structures
interface ProcessingResult {
  eventId: string;
  success: boolean;
  error?: string;
  artistId?: string;
  venueId?: string;
  showId?: string;
  executionTime: number;
}

interface SyncState {
  totalEvents: number;
  processedEvents: number;
  successfulEvents: number;
  failedEvents: number;
  skippedEvents: number;
  artistsCreated: number;
  venuesCreated: number;
  showsCreated: number;
  errors: string[];
  startTime: string;
  currentPhase: 'fetching' | 'processing_artists' | 'processing_venues' | 'processing_shows' | 'complete';
}

// Database Operations Manager
class DatabaseManager {
  constructor(private supabaseClient: any) {}

  // Batch upsert artists with conflict resolution
  async batchUpsertArtists(artists: Partial<DatabaseArtist>[]): Promise<DatabaseArtist[]> {
    if (artists.length === 0) return [];
    
    const endTimer = performanceMonitor.startTimer('batch_upsert_artists');
    
    try {
      logger.debug(`Batch upserting ${artists.length} artists`);
      
      const { data, error } = await this.supabaseClient
        .from('artists')
        .upsert(artists, {
          onConflict: 'ticketmaster_id',
          ignoreDuplicates: false
        })
        .select('*');

      if (error) {
        logger.error('Failed to batch upsert artists', { error, count: artists.length });
        throw error;
      }

      logger.info(`Successfully upserted ${data?.length || 0} artists`);
      return data || [];
    } finally {
      endTimer();
    }
  }

  // Batch upsert venues with enhanced data
  async batchUpsertVenues(venues: Partial<DatabaseVenue>[]): Promise<DatabaseVenue[]> {
    if (venues.length === 0) return [];
    
    const endTimer = performanceMonitor.startTimer('batch_upsert_venues');
    
    try {
      logger.debug(`Batch upserting ${venues.length} venues`);
      
      const { data, error } = await this.supabaseClient
        .from('venues')
        .upsert(venues, {
          onConflict: 'ticketmaster_id',
          ignoreDuplicates: false
        })
        .select('*');

      if (error) {
        logger.error('Failed to batch upsert venues', { error, count: venues.length });
        throw error;
      }

      logger.info(`Successfully upserted ${data?.length || 0} venues`);
      return data || [];
    } finally {
      endTimer();
    }
  }

  // Batch upsert shows with proper relationships
  async batchUpsertShows(shows: Partial<DatabaseShow>[]): Promise<DatabaseShow[]> {
    if (shows.length === 0) return [];
    
    const endTimer = performanceMonitor.startTimer('batch_upsert_shows');
    
    try {
      logger.debug(`Batch upserting ${shows.length} shows`);
      
      const { data, error } = await this.supabaseClient
        .from('cached_shows')
        .upsert(shows, {
          onConflict: 'ticketmaster_id',
          ignoreDuplicates: false
        })
        .select('*');

      if (error) {
        logger.error('Failed to batch upsert shows', { error, count: shows.length });
        throw error;
      }

      logger.info(`Successfully upserted ${data?.length || 0} shows`);
      return data || [];
    } finally {
      endTimer();
    }
  }

  // Update sync metrics in real-time
  async updateSyncMetrics(metrics: Partial<SyncMetrics>): Promise<void> {
    try {
      await this.supabaseClient
        .from('sync_events')
        .insert({
          event_type: 'popular_tours_sync',
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
class DataTransformer {
  static validateAndTransformArtist(artist: TicketmasterArtist): Partial<DatabaseArtist> | null {
    if (!artist.id || !artist.name) {
      logger.warn('Invalid artist data - missing required fields', { artist });
      return null;
    }

    // Extract Spotify ID from external links if available
    const spotifyUrl = artist.externalLinks?.spotify?.[0]?.url;
    const spotifyId = spotifyUrl ? this.extractSpotifyId(spotifyUrl) : undefined;

    // Extract genre information
    const genres = artist.classifications?.map(c => c.genre?.name).filter(Boolean) || [];

    return {
      ticketmaster_id: artist.id,
      name: artist.name.trim(),
      spotify_id: spotifyId,
      image_url: artist.images?.[0]?.url,
      genres: genres.length > 0 ? genres : undefined,
      metadata: {
        ticketmaster: artist,
        classifications: artist.classifications,
        images: artist.images
      },
      last_synced_at: new Date().toISOString()
    };
  }

  static validateAndTransformVenue(venue: TicketmasterVenue): Partial<DatabaseVenue> | null {
    if (!venue.id || !venue.name) {
      logger.warn('Invalid venue data - missing required fields', { venue });
      return null;
    }

    return {
      ticketmaster_id: venue.id,
      name: venue.name.trim(),
      city: venue.city?.name,
      state: venue.state?.name || venue.state?.stateCode,
      country: venue.country?.name || venue.country?.countryCode,
      metadata: {
        ticketmaster: venue,
        address: venue.address,
        location: venue.location
      },
      last_synced_at: new Date().toISOString()
    };
  }

  static validateAndTransformShow(
    event: TicketmasterEvent,
    artistId?: string,
    venueId?: string
  ): Partial<DatabaseShow> | null {
    if (!event.id || !event.name || !event.dates?.start?.dateTime) {
      logger.warn('Invalid event data - missing required fields', { event });
      return null;
    }

    const venue = event._embedded?.venues?.[0];

    return {
      ticketmaster_id: event.id,
      artist_id: artistId,
      venue_id: venueId,
      name: event.name.trim(),
      date: event.dates.start.dateTime,
      venue_name: venue?.name,
      venue_location: venue ? {
        city: venue.city?.name,
        state: venue.state?.name,
        country: venue.country?.name,
        address: venue.address
      } : undefined,
      ticket_url: event.url,
      last_synced_at: new Date().toISOString()
    };
  }

  private static extractSpotifyId(url: string): string | null {
    const match = url.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
}

// Event Quality Assessor
class EventQualityAssessor {
  static calculateEventScore(event: TicketmasterEvent): number {
    let score = 0;

    // Base score for having an event
    score += 10;

    // Artist information quality
    const artist = event._embedded?.attractions?.[0];
    if (artist) {
      score += 20;
      if (artist.images && artist.images.length > 0) score += 5;
      if (artist.classifications && artist.classifications.length > 0) score += 5;
      if (artist.externalLinks?.spotify) score += 10;
    }

    // Venue information quality
    const venue = event._embedded?.venues?.[0];
    if (venue) {
      score += 15;
      if (venue.city) score += 5;
      if (venue.address) score += 5;
    }

    // Event timing
    const eventDate = new Date(event.dates.start.dateTime);
    const now = new Date();
    const daysFromNow = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysFromNow > 0 && daysFromNow < 365) {
      score += 10; // Future event within a year
    }

    // Event URL quality
    if (event.url) score += 5;

    return score;
  }

  static isEventWorthProcessing(event: TicketmasterEvent): boolean {
    const score = this.calculateEventScore(event);
    return score >= POPULARITY_THRESHOLD;
  }
}

// Main Sync Orchestrator
class PopularToursSync {
  private state: SyncState;
  private dbManager: DatabaseManager;

  constructor(private supabaseClient: any) {
    this.dbManager = new DatabaseManager(supabaseClient);
    this.state = {
      totalEvents: 0,
      processedEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      skippedEvents: 0,
      artistsCreated: 0,
      venuesCreated: 0,
      showsCreated: 0,
      errors: [],
      startTime: new Date().toISOString(),
      currentPhase: 'fetching'
    };
  }

  async execute(): Promise<ApiResponse<SyncMetrics>> {
    const startTime = performance.now();
    logger.info('Starting popular tours sync job');

    try {
      // Phase 1: Fetch popular events
      this.state.currentPhase = 'fetching';
      const events = await this.fetchPopularEvents();
      this.state.totalEvents = events.length;

      if (events.length === 0) {
        logger.warn('No events fetched from Ticketmaster API');
        return createApiResponse(false, undefined, 'No events available to sync');
      }

      logger.info(`Fetched ${events.length} events for processing`);

      // Filter events by quality
      const qualityEvents = events.filter(event => EventQualityAssessor.isEventWorthProcessing(event));
      logger.info(`${qualityEvents.length} events passed quality assessment`);

      // Phase 2: Process events in batches
      await this.processEventsInBatches(qualityEvents);

      // Phase 3: Update final metrics
      const executionTime = performance.now() - startTime;
      this.state.currentPhase = 'complete';

      const metrics: SyncMetrics = {
        processed: this.state.processedEvents,
        errors: this.state.failedEvents,
        skipped: this.state.skippedEvents,
        total: this.state.totalEvents,
        startTime: this.state.startTime,
        endTime: new Date().toISOString(),
        executionTimeMs: Math.round(executionTime)
      };

      await this.dbManager.updateSyncMetrics(metrics);

      logger.info('Popular tours sync completed successfully', metrics);

      return createApiResponse(true, metrics, undefined, {
        artistsCreated: this.state.artistsCreated,
        venuesCreated: this.state.venuesCreated,
        showsCreated: this.state.showsCreated,
        qualityScore: qualityEvents.length / events.length
      });

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Popular tours sync failed', {
        error: errorMessage,
        executionTime: Math.round(executionTime),
        state: this.state
      });

      const metrics: SyncMetrics = {
        processed: this.state.processedEvents,
        errors: this.state.failedEvents + 1,
        skipped: this.state.skippedEvents,
        total: this.state.totalEvents,
        startTime: this.state.startTime,
        endTime: new Date().toISOString(),
        executionTimeMs: Math.round(executionTime)
      };

      await this.dbManager.updateSyncMetrics(metrics);

      return createApiResponse(false, metrics, errorMessage);
    }
  }

  private async fetchPopularEvents(): Promise<TicketmasterEvent[]> {
    const endTimer = performanceMonitor.startTimer('fetch_popular_events');

    try {
      const { data, error } = await this.supabaseClient.functions.invoke('ticketmaster', {
        body: {
          endpoint: 'featured',
          params: {
            size: MAX_EVENTS_TO_PROCESS.toString(),
            sort: 'relevance,desc',
            countryCode: 'US'
          }
        }
      });

      if (error) {
        logger.error('Failed to fetch events from Ticketmaster function', { error });
        throw new Error(`Ticketmaster API error: ${error.message}`);
      }

      const events = data?.data?._embedded?.events || [];
      logger.info(`Successfully fetched ${events.length} events from Ticketmaster`);

      return events;
    } finally {
      endTimer();
    }
  }

  private async processEventsInBatches(events: TicketmasterEvent[]): Promise<void> {
    const batchProcessor = new BatchProcessor<TicketmasterEvent, ProcessingResult>(SYNC_CONFIG);

    const results = await batchProcessor.processBatch(
      events,
      (event) => this.processEvent(event),
      (processed, total) => {
        this.state.processedEvents = processed;
        if (processed % 50 === 0) {
          logger.info(`Progress: ${processed}/${total} events processed`);
        }
      }
    );

    // Aggregate results
    const successful = results.filter(r => r.result?.success);
    const failed = results.filter(r => r.error || !r.result?.success);

    this.state.successfulEvents = successful.length;
    this.state.failedEvents = failed.length;

    // Log any persistent errors
    failed.forEach(failure => {
      const errorMsg = failure.error?.message || failure.result?.error || 'Unknown error';
      this.state.errors.push(errorMsg);
      if (this.state.errors.length <= 10) { // Limit error logging
        logger.warn('Event processing failed', {
          eventId: failure.item.id,
          eventName: failure.item.name,
          error: errorMsg
        });
      }
    });
  }

  private async processEvent(event: TicketmasterEvent): Promise<ProcessingResult> {
    const startTime = performance.now();
    const eventId = event.id;

    try {
      // Extract and validate components
      const artist = event._embedded?.attractions?.[0];
      const venue = event._embedded?.venues?.[0];

      if (!artist || !venue) {
        return {
          eventId,
          success: false,
          error: 'Missing required artist or venue data',
          executionTime: performance.now() - startTime
        };
      }

      // Transform data
      const artistData = DataTransformer.validateAndTransformArtist(artist);
      const venueData = DataTransformer.validateAndTransformVenue(venue);

      if (!artistData || !venueData) {
        return {
          eventId,
          success: false,
          error: 'Data transformation failed',
          executionTime: performance.now() - startTime
        };
      }

      // Process with circuit breaker protection
      return await circuitBreaker.execute(async () => {
        // Upsert artist
        const [upsertedArtist] = await this.dbManager.batchUpsertArtists([artistData]);
        if (upsertedArtist?.id) this.state.artistsCreated++;

        // Upsert venue
        const [upsertedVenue] = await this.dbManager.batchUpsertVenues([venueData]);
        if (upsertedVenue?.id) this.state.venuesCreated++;

        // Create show data
        const showData = DataTransformer.validateAndTransformShow(
          event,
          upsertedArtist?.id,
          upsertedVenue?.id
        );

        if (!showData) {
          throw new Error('Show data transformation failed');
        }

        // Upsert show
        const [upsertedShow] = await this.dbManager.batchUpsertShows([showData]);
        if (upsertedShow?.id) this.state.showsCreated++;

        return {
          eventId,
          success: true,
          artistId: upsertedArtist?.id,
          venueId: upsertedVenue?.id,
          showId: upsertedShow?.id,
          executionTime: performance.now() - startTime
        };
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      logger.debug('Event processing failed', { eventId, error: errorMessage });

      return {
        eventId,
        success: false,
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
    logger.info('Popular tours sync job initiated');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Execute sync
    const syncJob = new PopularToursSync(supabaseClient);
    const result = await syncJob.execute();

    const totalTime = performance.now() - startTime;
    result.executionTime = Math.round(totalTime);

    logger.info('Popular tours sync job completed', {
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