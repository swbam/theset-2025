import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

// Rate limiting setup
const RATE_LIMIT = 5; // requests per second
const QUEUE: Array<() => Promise<Response>> = [];
let processingQueue = false;

async function processQueue() {
  if (processingQueue || QUEUE.length === 0) return;
  
  processingQueue = true;
  while (QUEUE.length > 0) {
    const request = QUEUE.shift();
    if (request) {
      await request();
      // Wait 200ms between requests (5 requests per second)
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  processingQueue = false;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Base query parameters
    const queryParams = new URLSearchParams({
      apikey: secretData.value,
      classificationName: 'music',
    });

    // Endpoint-specific parameters
    let apiUrl: string;
    
    switch (endpoint) {
      case 'search':
        if (query) {
          queryParams.append('keyword', query);
        }
        queryParams.append('sort', 'date,asc');
        apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;
        break;
      case 'artist':
        if (query) {
          queryParams.append('keyword', query);
        }
        queryParams.append('sort', 'date,asc');
        queryParams.append('size', '50');
        apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;
        break;
      case 'events':
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (key !== 'apikey' && value) {
              queryParams.append(key, value.toString());
            }
          });
        }
        if (!params?.sort) {
          queryParams.append('sort', 'date,asc');
        }
        // Set size parameter if not already set
        if (!queryParams.has('size')) {
          queryParams.append('size', '20');
        }
        apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;
        break;
      case 'venues':
        // For venue endpoint, we need venue ID from request body
        if (!query) {
          throw new Error('Venue ID is required for venues endpoint');
        }
        // Venue details API endpoint
        apiUrl = `${BASE_URL}/venues/${query}.json?apikey=${secretData.value}`;
        break;
      case 'featured': {
        const now = new Date();
        const startDateTime = now.toISOString().slice(0, 19) + 'Z';
        queryParams.append('startDateTime', startDateTime);
        queryParams.append('sort', 'relevance,desc');
        queryParams.append('countryCode', 'US');
        // Set size parameter if not already set
        if (!queryParams.has('size')) {
          queryParams.append('size', '20');
        }
        apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;
        break;
      }
      default:
        throw new Error('Invalid endpoint');
    }
    console.log('Making request to:', apiUrl);

    // Create the request function
    const makeRequest = async () => {
      const response = await fetch(apiUrl);
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Ticketmaster API error:', responseText);
        throw new Error(`Ticketmaster API error: ${response.status} - ${responseText}`);
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log('Received response with data:', data._embedded?.events?.length || 0, 'events');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid JSON response from Ticketmaster API');
      }
    };

    // Add request to queue
    return new Promise((resolve) => {
      QUEUE.push(async () => {
        try {
          const response = await makeRequest();
          resolve(response);
        } catch (error) {
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