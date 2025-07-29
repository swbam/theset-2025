// Simple data loading test function for sync-popular-tours
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    console.log('Starting simplified popular tours sync...');
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API key
    const { data: keyData, error: keyError } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('key', 'TICKETMASTER_API_KEY')
      .single();

    if (keyError || !keyData?.value) {
      throw new Error('Failed to get Ticketmaster API key');
    }

    const apiKey = keyData.value;
    
    // Fetch popular events directly from Ticketmaster
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=music&sort=relevance,desc&size=50&countryCode=US`;
    
    console.log('Fetching from Ticketmaster API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const events = data._embedded?.events || [];
    
    console.log(`Found ${events.length} events`);
    
    // Process first 10 events to test
    const processedShows = [];
    const processedArtists = [];
    
    for (const event of events.slice(0, 10)) {
      try {
        const artist = event._embedded?.attractions?.[0];
        const venue = event._embedded?.venues?.[0];
        
        if (!artist || !venue || !event.dates?.start?.dateTime) {
          continue;
        }
        
        // Process artist
        const artistData = {
          ticketmaster_id: artist.id,
          name: artist.name,
          image_url: artist.images?.[0]?.url || null,
          genres: artist.classifications?.map(c => c.genre?.name).filter(Boolean) || [],
          last_synced_at: new Date().toISOString()
        };
        
        // Upsert artist
        const { data: upsertedArtist, error: artistError } = await supabaseClient
          .from('artists')
          .upsert(artistData, { onConflict: 'ticketmaster_id' })
          .select()
          .single();
          
        if (artistError) {
          console.error('Error upserting artist:', artistError);
          continue;
        }
        
        processedArtists.push(upsertedArtist);
        
        // Process show
        const showData = {
          ticketmaster_id: event.id,
          artist_id: upsertedArtist.id,
          name: event.name,
          date: event.dates.start.dateTime,
          venue_name: venue.name,
          venue_location: {
            city: venue.city?.name,
            state: venue.state?.name,
            country: venue.country?.name
          },
          ticket_url: event.url,
          last_synced_at: new Date().toISOString()
        };
        
        // Upsert show
        const { data: upsertedShow, error: showError } = await supabaseClient
          .from('cached_shows')
          .upsert(showData, { onConflict: 'ticketmaster_id' })
          .select()
          .single();
          
        if (showError) {
          console.error('Error upserting show:', showError);
          continue;
        }
        
        processedShows.push(upsertedShow);
        
      } catch (error) {
        console.error('Error processing event:', error);
      }
    }
    
    console.log(`Processed ${processedArtists.length} artists and ${processedShows.length} shows`);
    
    return createCorsResponse({
      success: true,
      data: {
        artistsProcessed: processedArtists.length,
        showsProcessed: processedShows.length,
        totalEvents: events.length
      }
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return createCorsResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});