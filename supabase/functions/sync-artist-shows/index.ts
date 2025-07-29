// Background sync for artist shows import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import { Logger } from '../_shared/utils.ts';

const logger = Logger.getInstance().setContext('SYNC_ARTIST_SHOWS');

interface SyncRequest {
  artistName: string;
  events: any[];
}

// Process and import artist and their shows
async function syncArtistShows(artistName: string, events: any[], supabaseClient: any) {
  logger.info('Starting artist shows sync', { artistName, eventCount: events.length });

  let artistId: string | null = null;

  try {
    // Check if artist exists
    const { data: existingArtist } = await supabaseClient
      .from('artists')
      .select('id')
      .eq('name', artistName)
      .maybeSingle();

    if (existingArtist) {
      artistId = existingArtist.id;
      logger.info('Found existing artist', { artistId, artistName });
    } else {
      // Create new artist from first event data
      const firstEvent = events[0];
      const artistData = firstEvent._embedded?.attractions?.[0];
      
      if (artistData) {
        const { data: newArtist, error } = await supabaseClient
          .from('artists')
          .insert({
            name: artistName,
            ticketmaster_id: artistData.id,
            image_url: artistData.images?.[0]?.url,
            genres: artistData.classifications?.map((c: any) => c.genre?.name).filter(Boolean) || [],
            metadata: artistData
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to create artist', { error, artistName });
          return;
        }

        artistId = newArtist.id;
        logger.info('Created new artist', { artistId, artistName });

        // Also sync artist's complete song catalog from Spotify
        try {
          await supabaseClient.functions.invoke('sync-artist-songs', {
            body: { artistId, artistName }
          });
        } catch (spotifyError) {
          logger.warn('Failed to sync artist songs', { error: spotifyError });
        }
      }
    }

    if (!artistId) {
      logger.error('Could not determine artist ID');
      return;
    }

    // Process each event
    let processedCount = 0;
    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        if (!venue) continue;

        // Check if venue exists, create if needed
        let venueId: string | null = null;
        const { data: existingVenue } = await supabaseClient
          .from('venues')
          .select('id')
          .eq('ticketmaster_id', venue.id)
          .maybeSingle();

        if (existingVenue) {
          venueId = existingVenue.id;
        } else {
          const { data: newVenue, error: venueError } = await supabaseClient
            .from('venues')
            .insert({
              name: venue.name,
              ticketmaster_id: venue.id,
              city: venue.city?.name,
              state: venue.state?.name || venue.city?.state?.name,
              country: venue.country?.name,
              metadata: venue
            })
            .select()
            .single();

          if (venueError) {
            logger.warn('Failed to create venue', { error: venueError });
            continue;
          }
          venueId = newVenue.id;
        }

        if (!venueId) continue;

        // Check if show already exists
        const { data: existingShow } = await supabaseClient
          .from('shows')
          .select('id')
          .eq('ticketmaster_id', event.id)
          .maybeSingle();

        if (!existingShow) {
          // Create new show
          const { error: showError } = await supabaseClient
            .from('shows')
            .insert({
              artist_id: artistId,
              venue_id: venueId,
              ticketmaster_id: event.id,
              date: event.dates.start.dateTime,
              status: 'upcoming',
              ticket_url: event.url
            });

          if (showError) {
            logger.warn('Failed to create show', { error: showError });
          } else {
            processedCount++;
          }
        }
      } catch (eventError) {
        logger.warn('Failed to process event', { error: eventError, eventId: event.id });
      }
    }

    logger.info('Artist shows sync completed', { 
      artistName, 
      processedCount, 
      totalEvents: events.length 
    });

  } catch (error) {
    logger.error('Artist shows sync failed', { error, artistName });
  }
}

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    const { artistName, events }: SyncRequest = await req.json();

    if (!artistName || !events) {
      return createCorsResponse(
        { success: false, error: 'Missing artistName or events' },
        400
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Start background sync
    syncArtistShows(artistName, events, supabaseClient);

    return createCorsResponse(
      { success: true, message: 'Sync started', eventCount: events.length },
      200
    );

  } catch (error) {
    logger.error('Sync request failed', { error });
    return createCorsResponse(
      { success: false, error: 'Internal server error' },
      500
    );
  }
});