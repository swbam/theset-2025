// Auto-sync artist shows, venues, and songs when artist is clicked
// Triggers comprehensive sync for artists not in database

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import { Logger, PerformanceMonitor, createApiResponse } from '../_shared/utils.ts';

const logger = Logger.getInstance().setContext('AUTO_SYNC_ARTIST');
const performanceMonitor = new PerformanceMonitor();

interface AutoSyncRequest {
  artistName: string;
  forceSync?: boolean;
}

// Main auto-sync orchestrator
class ArtistAutoSync {
  constructor(private supabaseClient: SupabaseClient) {}

  async execute(artistName: string, forceSync = false): Promise<any> {
    const startTime = performance.now();
    logger.info('Starting auto-sync for artist', { artistName, forceSync });

    try {
      // Check if artist exists in database
      const { data: existingArtist } = await this.supabaseClient
        .from('artists')
        .select('id, name, spotify_id, last_synced_at')
        .ilike('name', artistName)
        .maybeSingle();

      // If artist exists and was recently synced, return existing data
      if (existingArtist && !forceSync) {
        const lastSynced = existingArtist.last_synced_at ? new Date(existingArtist.last_synced_at) : null;
        const daysSinceSync = lastSynced ? (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60 * 24) : Infinity;
        
        if (daysSinceSync < 7) { // If synced within last week
          logger.info('Artist recently synced, returning existing data', { artistName, daysSinceSync });
          
          // Get artist's shows
          const { data: shows } = await this.supabaseClient
            .from('cached_shows')
            .select(`
              *,
              artist:artists(id, name, spotify_id)
            `)
            .eq('artist_id', existingArtist.id)
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true });

          return createApiResponse(true, {
            artist: existingArtist,
            shows: shows || [],
            fromCache: true,
            lastSynced: existingArtist.last_synced_at
          });
        }
      }

      // Artist needs to be synced - trigger comprehensive sync
      logger.info('Triggering comprehensive sync for artist', { artistName });
      
      const syncResults = await this.triggerComprehensiveSync(artistName);
      
      const executionTime = performance.now() - startTime;
      return createApiResponse(true, {
        ...syncResults,
        synced: true,
        executionTime: Math.round(executionTime)
      });

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Auto-sync failed', { artistName, error: errorMessage, executionTime });
      
      return createApiResponse(false, undefined, errorMessage, {
        executionTime: Math.round(executionTime)
      });
    }
  }

  private async triggerComprehensiveSync(artistName: string): Promise<any> {
    const endTimer = performanceMonitor.startTimer('comprehensive_sync');
    
    try {
      // Step 1: Search for artist events on Ticketmaster
      logger.info('Searching Ticketmaster for artist events', { artistName });
      
      const { data: ticketmasterData, error: tmError } = await this.supabaseClient.functions.invoke('ticketmaster', {
        body: {
          endpoint: 'search',
          query: artistName,
          params: { size: '50' }
        }
      });

      if (tmError) {
        throw new Error(`Ticketmaster search failed: ${tmError.message}`);
      }

      const events = ticketmasterData?.data?._embedded?.events || [];
      logger.info(`Found ${events.length} events for artist`, { artistName });

      if (events.length === 0) {
        return { artist: null, shows: [], message: 'No events found for artist' };
      }

      // Step 2: Extract and import artist data
      const artistData = this.extractArtistFromEvents(events, artistName);
      let artist = null;
      
      if (artistData) {
        const { data: upsertedArtist, error: artistError } = await this.supabaseClient
          .from('artists')
          .upsert(artistData, { onConflict: 'name' })
          .select()
          .single();

        if (artistError) {
          logger.warn('Failed to upsert artist', { artistName, error: artistError });
        } else {
          artist = upsertedArtist;
          logger.info('Artist upserted successfully', { artistId: artist.id, artistName });
        }
      }

      // Step 3: Import venues and shows
      const importedShows = await this.importShowsAndVenues(events, artist?.id);
      
      // Step 4: Trigger artist songs sync if we have Spotify ID
      if (artist?.spotify_id) {
        logger.info('Triggering artist songs sync', { artistId: artist.id, spotifyId: artist.spotify_id });
        
        this.supabaseClient.functions.invoke('sync-artist-songs', {
          body: { artistId: artist.id }
        }).catch(error => {
          logger.warn('Songs sync failed', { artistId: artist.id, error: error.message });
        });
      }

      return {
        artist,
        shows: importedShows,
        eventsFound: events.length,
        message: `Successfully synced ${importedShows.length} shows for ${artistName}`
      };

    } finally {
      endTimer();
    }
  }

  private extractArtistFromEvents(events: any[], searchName: string): any | null {
    // Find the most relevant artist from events
    const artistCounts = new Map();
    
    events.forEach(event => {
      const artist = event._embedded?.attractions?.[0];
      if (artist && artist.name) {
        const count = artistCounts.get(artist.id) || 0;
        artistCounts.set(artist.id, count + 1);
        artistCounts.set(`${artist.id}_data`, artist);
      }
    });

    if (artistCounts.size === 0) return null;

    // Get the artist with most events
    let mostFrequentArtist = null;
    let maxCount = 0;
    
    for (const [key, value] of artistCounts.entries()) {
      if (typeof value === 'number' && value > maxCount) {
        maxCount = value;
        mostFrequentArtist = artistCounts.get(`${key}_data`);
      }
    }

    if (!mostFrequentArtist) return null;

    // Extract Spotify ID from external links if available
    const spotifyUrl = mostFrequentArtist.externalLinks?.spotify?.[0]?.url;
    const spotifyId = spotifyUrl ? this.extractSpotifyId(spotifyUrl) : null;

    return {
      ticketmaster_id: mostFrequentArtist.id,
      name: mostFrequentArtist.name,
      spotify_id: spotifyId,
      image_url: mostFrequentArtist.images?.[0]?.url,
      genres: mostFrequentArtist.classifications?.map((c: any) => c.genre?.name).filter(Boolean) || [],
      metadata: {
        ticketmaster: mostFrequentArtist,
        eventCount: maxCount
      },
      last_synced_at: new Date().toISOString()
    };
  }

  private async importShowsAndVenues(events: any[], artistId?: string): Promise<any[]> {
    const shows = [];
    
    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        let venueId = null;

        // Import venue if exists
        if (venue) {
          const venueData = {
            ticketmaster_id: venue.id,
            name: venue.name,
            city: venue.city?.name,
            state: venue.state?.name || venue.state?.stateCode,
            country: venue.country?.name || venue.country?.countryCode,
            metadata: { ticketmaster: venue },
            last_synced_at: new Date().toISOString()
          };

          const { data: upsertedVenue } = await this.supabaseClient
            .from('venues')
            .upsert(venueData, { onConflict: 'ticketmaster_id' })
            .select('id')
            .single();

          venueId = upsertedVenue?.id;
        }

        // Import show
        const showData = {
          ticketmaster_id: event.id,
          artist_id: artistId,
          name: event.name,
          date: event.dates?.start?.dateTime,
          venue_name: venue?.name,
          venue_location: venue ? {
            city: venue.city?.name,
            state: venue.state?.name,
            country: venue.country?.name
          } : null,
          ticket_url: event.url,
          last_synced_at: new Date().toISOString()
        };

        const { data: upsertedShow, error: showError } = await this.supabaseClient
          .from('cached_shows')
          .upsert(showData, { onConflict: 'ticketmaster_id' })
          .select()
          .single();

        if (!showError && upsertedShow) {
          shows.push(upsertedShow);
          
          // Create setlist for new show
          await this.createSetlistForShow(upsertedShow);
        }

      } catch (error) {
        logger.warn('Failed to import event', { 
          eventId: event.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return shows;
  }

  private async createSetlistForShow(show: any): Promise<void> {
    try {
      // Check if setlist already exists
      const { data: existingSetlist } = await this.supabaseClient
        .from('setlists')
        .select('id')
        .eq('show_id', show.id)
        .maybeSingle();

      if (existingSetlist) return; // Setlist already exists

      // Get artist's songs
      const { data: songs } = await this.supabaseClient
        .from('cached_songs')
        .select('id, spotify_id, name, album, popularity')
        .eq('artist_id', show.artist_id)
        .order('popularity', { ascending: false })
        .limit(20);

      if (!songs || songs.length === 0) {
        logger.info('No songs found for artist, skipping setlist creation', { 
          showId: show.id, 
          artistId: show.artist_id 
        });
        return;
      }

      // Select 5 random songs weighted by popularity
      const selectedSongs = this.selectRandomSongs(songs, 5);
      
      const setlistSongs = selectedSongs.map((song, index) => ({
        id: crypto.randomUUID(),
        song_id: song.id,
        song_name: song.name,
        spotify_id: song.spotify_id,
        album: song.album,
        vote_count: 0,
        suggested: false,
        order_index: index,
        created_at: new Date().toISOString()
      }));

      await this.supabaseClient
        .from('setlists')
        .insert({
          show_id: show.id,
          songs: setlistSongs
        });

      logger.info('Created setlist for show', { 
        showId: show.id, 
        songsCount: setlistSongs.length 
      });

    } catch (error) {
      logger.warn('Failed to create setlist', { 
        showId: show.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private selectRandomSongs(songs: any[], count: number): any[] {
    if (songs.length <= count) return songs;

    // Weighted random selection
    const weighted: any[] = [];
    songs.forEach(song => {
      const weight = Math.max(1, song.popularity || 50);
      for (let i = 0; i < weight; i++) {
        weighted.push(song);
      }
    });

    const selected: any[] = [];
    const used = new Set<string>();

    while (selected.length < count && used.size < songs.length) {
      const randomIndex = Math.floor(Math.random() * weighted.length);
      const song = weighted[randomIndex];
      
      if (!used.has(song.id)) {
        selected.push(song);
        used.add(song.id);
      }
    }

    return selected;
  }

  private extractSpotifyId(url: string): string | null {
    const match = url.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
}

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    const { artistName, forceSync = false }: AutoSyncRequest = await req.json();
    
    if (!artistName) {
      return createCorsResponse(
        createApiResponse(false, undefined, 'Artist name is required'),
        400
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const autoSync = new ArtistAutoSync(supabaseClient);
    const result = await autoSync.execute(artistName, forceSync);

    const totalTime = performance.now() - startTime;
    result.executionTime = Math.round(totalTime);

    return createCorsResponse(result, result.success ? 200 : 500);

  } catch (error) {
    const totalTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    logger.error('Auto-sync handler error', { error: errorMessage, executionTime: totalTime });

    const errorResponse = createApiResponse(false, undefined, errorMessage, {
      executionTime: totalTime
    });

    return createCorsResponse(errorResponse, 500);
  }
});