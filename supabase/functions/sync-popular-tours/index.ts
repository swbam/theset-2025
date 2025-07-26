import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting popular tours sync job...');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Call our existing ticketmaster function to get popular tours
    const { data: popularTours, error: ticketmasterError } = await supabaseClient.functions.invoke('ticketmaster', {
      body: { 
        endpoint: 'featured',
        params: {
          size: '50',
          sort: 'relevance,desc'
        }
      },
    });

    if (ticketmasterError) {
      console.error('Error fetching popular tours:', ticketmasterError);
      throw ticketmasterError;
    }

    const events = popularTours?._embedded?.events || [];
    console.log(`Processing ${events.length} popular tour events...`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each event
    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        const artist = event._embedded?.attractions?.[0];

        if (!venue || !artist) {
          console.log(`Skipping event ${event.name} - missing venue or artist data`);
          continue;
        }

        // Cache venue
        const { error: venueError } = await supabaseClient
          .from('venues')
          .upsert({
            ticketmaster_id: venue.id,
            name: venue.name,
            metadata: venue
          });

        if (venueError) {
          console.error(`Error caching venue ${venue.name}:`, venueError);
        }

        // Cache artist and get the ID
        const { data: artistData, error: artistError } = await supabaseClient
          .from('artists')
          .upsert({
            ticketmaster_id: artist.id,
            name: artist.name,
            metadata: artist,
            last_synced_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (artistError) {
          console.error(`Error caching artist ${artist.name}:`, artistError);
        }

        // Cache show with artist_id
        const { error: showError } = await supabaseClient
          .from('cached_shows')
          .upsert({
            ticketmaster_id: event.id,
            artist_id: artistData?.id || null,
            name: event.name,
            date: event.dates?.start?.dateTime,
            venue_name: venue.name,
            venue_location: venue,
            ticket_url: event.url,
            last_synced_at: new Date().toISOString()
          });

        if (showError) {
          console.error(`Error caching show ${event.name}:`, showError);
          errorCount++;
        } else {
          processedCount++;
        }

      } catch (error) {
        console.error(`Error processing event ${event.name}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Sync completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      totalEvents: events.length,
      processedCount,
      errorCount,
      timestamp: new Date().toISOString()
    };

    console.log('Popular tours sync completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-popular-tours function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});