// Simplified auto-sync-artist function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    const { artistName } = await req.json();
    
    if (!artistName) {
      return createCorsResponse({
        success: false,
        error: 'Artist name is required'
      }, 400);
    }
    
    console.log('Auto-syncing artist:', artistName);
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if artist already exists
    const { data: existingArtist } = await supabaseClient
      .from('artists')
      .select('*')
      .ilike('name', artistName)
      .maybeSingle();
      
    if (existingArtist) {
      // Get shows for existing artist
      const { data: shows } = await supabaseClient
        .from('cached_shows')
        .select('*')
        .eq('artist_id', existingArtist.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });
        
      return createCorsResponse({
        success: true,
        data: {
          artist: existingArtist,
          shows: shows || []
        }
      });
    }

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
    
    // Search for artist events from Ticketmaster
    const searchUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&keyword=${encodeURIComponent(artistName)}&classificationName=music&sort=date,asc&size=50`;
    
    console.log('Searching Ticketmaster for:', artistName);
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data._embedded?.events || [];
    
    console.log(`Found ${events.length} events for ${artistName}`);
    
    if (events.length === 0) {
      return createCorsResponse({
        success: true,
        data: {
          artist: null,
          shows: []
        }
      });
    }
    
    // Process first event to create artist
    const firstEvent = events[0];
    const artist = firstEvent._embedded?.attractions?.[0];
    
    if (!artist) {
      throw new Error('No artist data found in events');
    }
    
    // Create artist
    const artistData = {
      ticketmaster_id: artist.id,
      name: artist.name,
      image_url: artist.images?.[0]?.url || null,
      genres: artist.classifications?.map(c => c.genre?.name).filter(Boolean) || [],
      last_synced_at: new Date().toISOString()
    };
    
    const { data: newArtist, error: artistError } = await supabaseClient
      .from('artists')
      .upsert(artistData, { onConflict: 'ticketmaster_id' })
      .select()
      .single();
      
    if (artistError) {
      throw new Error(`Failed to create artist: ${artistError.message}`);
    }
    
    // Process shows
    const processedShows = [];
    
    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        
        if (!venue || !event.dates?.start?.dateTime) {
          continue;
        }
        
        const showData = {
          ticketmaster_id: event.id,
          artist_id: newArtist.id,
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
        
        const { data: show, error: showError } = await supabaseClient
          .from('cached_shows')
          .upsert(showData, { onConflict: 'ticketmaster_id' })
          .select()
          .single();
          
        if (!showError && show) {
          processedShows.push(show);
        }
        
      } catch (error) {
        console.error('Error processing show:', error);
      }
    }
    
    console.log(`Created artist and ${processedShows.length} shows`);
    
    return createCorsResponse({
      success: true,
      data: {
        artist: newArtist,
        shows: processedShows
      }
    });
    
  } catch (error) {
    console.error('Auto-sync error:', error);
    return createCorsResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});