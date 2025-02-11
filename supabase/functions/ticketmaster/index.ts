
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

// Rate limiting setup - 5 requests per second as per Ticketmaster's limit
const RATE_LIMIT = 5; // requests per second
const QUEUE: Array<() => Promise<Response>> = [];
let processingQueue = false;
let lastRequestTime = 0;

async function processQueue() {
  if (processingQueue || QUEUE.length === 0) return;
  
  processingQueue = true;
  while (QUEUE.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Ensure minimum 200ms between requests (5 requests per second)
    if (timeSinceLastRequest < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastRequest));
    }
    
    const request = QUEUE.shift();
    if (request) {
      lastRequestTime = Date.now();
      await request();
    }
  }
  processingQueue = false;
}

function formatDateRange(startDate: string, endDate: string): string {
  try {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date values provided');
    }
    
    // Format to UTC ISO strings without milliseconds
    const formattedStart = start.toISOString().split('.')[0] + 'Z';
    const formattedEnd = end.toISOString().split('.')[0] + 'Z';
    
    console.log('Start date:', formattedStart);
    console.log('End date:', formattedEnd);
    
    return `${formattedStart},${formattedEnd}`;
  } catch (error) {
    console.error('Error formatting dates:', error);
    throw new Error(`Invalid date format: ${error.message}`);
  }
}

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

    // Base query parameters
    const queryParams = new URLSearchParams({
      apikey: secretData.value,
      classificationName: 'music',
    });

    // Handle date parameters
    if (params?.startDate && params?.endDate) {
      try {
        const formattedDateRange = formatDateRange(params.startDate, params.endDate);
        queryParams.set('startDateTime', formattedDateRange.split(',')[0]);
        queryParams.set('endDateTime', formattedDateRange.split(',')[1]);
        console.log('Using date range:', queryParams.toString());
      } catch (error) {
        console.error('Error formatting date range:', error);
        throw error;
      }
    }

    // Endpoint-specific parameters
    switch (endpoint) {
      case 'search':
        if (query) {
          queryParams.append('keyword', query);
        }
        queryParams.append('sort', 'date,asc');
        break;
      case 'artist':
        if (query) {
          queryParams.append('keyword', query);
        }
        queryParams.append('sort', 'date,asc');
        queryParams.append('size', '50');
        break;
      case 'events':
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (key !== 'apikey' && key !== 'startDate' && key !== 'endDate' && value) {
              queryParams.append(key, value.toString());
            }
          });
        }
        if (!params?.sort) {
          queryParams.append('sort', 'date,asc');
        }
        break;
      case 'featured':
        queryParams.append('sort', 'relevance,desc');
        queryParams.append('countryCode', 'US');
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    // Set size parameter if not already set
    if (!queryParams.has('size')) {
      queryParams.append('size', '20');
    }

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
        console.log('Received response with data:', data._embedded?.events?.length || 0, 'events');
        
        return new Response(JSON.stringify(data._embedded?.events || []), {
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
