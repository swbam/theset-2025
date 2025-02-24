
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';
import { QUEUE, processQueue } from '../_shared/rateLimit.ts';
import { isLargeVenue } from './venues.ts';
import { buildQueryParams } from './queryBuilder.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const { endpoint, query, params } = await req.json();
    console.log(`Processing ${endpoint} request with query:`, query, 'and params:', params);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('key', 'TICKETMASTER_API_KEY')
      .single();

    if (secretError) {
      console.error('Failed to get API key:', secretError);
      throw new Error('Failed to retrieve Ticketmaster API key');
    }

    if (!secretData?.value) {
      console.error('API key not found in secrets table');
      throw new Error('Ticketmaster API key not found in secrets table');
    }

    params.apikey = secretData.value;
    const queryParams = buildQueryParams(endpoint, query, params);
    const apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;
    console.log('Making request to:', apiUrl);

    // Create the request function
    const makeRequest = async () => {
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            // If we hit the rate limit, wait and retry
            console.log('Rate limit hit, retrying after delay...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return makeRequest();
          }
          
          const errorText = await response.text();
          console.error('Ticketmaster API error:', response.status, errorText);
          throw new Error(`Ticketmaster API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let events = data?._embedded?.events || [];
        console.log(`Retrieved ${events.length} events from Ticketmaster`);

        // For top shows, filter and sort by venue capacity
        if (endpoint === 'topShows') {
          events = events
            .filter((event: any) => {
              try {
                const venue = event?._embedded?.venues?.[0];
                return venue ? isLargeVenue(venue) : false;
              } catch (error) {
                console.error('Error filtering venue:', error);
                return false;
              }
            })
            .sort((a: any, b: any) => {
              try {
                const venueA = a?._embedded?.venues?.[0];
                const venueB = b?._embedded?.venues?.[0];
                const capacityA = venueA?.capacity ? parseInt(venueA.capacity) : 0;
                const capacityB = venueB?.capacity ? parseInt(venueB.capacity) : 0;
                return capacityB - capacityA;
              } catch (error) {
                console.error('Error sorting venues:', error);
                return 0;
              }
            })
            .slice(0, 6);
            
          console.log(`Filtered to ${events.length} large venue events`);
        }
        
        return new Response(JSON.stringify({ _embedded: { events } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error in makeRequest:', error);
        throw error;
      }
    };

    // Add request to queue and process
    return new Promise((resolve) => {
      QUEUE.push(async () => {
        try {
          const response = await makeRequest();
          resolve(response);
        } catch (error) {
          console.error('Error processing request:', error);
          resolve(new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }));
        }
      });
      processQueue();
    });

  } catch (error) {
    console.error('Error in ticketmaster function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
