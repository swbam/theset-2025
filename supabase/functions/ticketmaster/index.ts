
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

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

    let apiUrl = `${BASE_URL}/events.json?`;
    const queryParams = new URLSearchParams();
    
    // Add the API key
    queryParams.append('apikey', secretData.value);

    switch (endpoint) {
      case 'search':
        queryParams.append('keyword', query || '');
        queryParams.append('classificationName', 'music');
        queryParams.append('size', '20');
        queryParams.append('sort', 'date,asc');
        break;
      case 'artist':
        queryParams.append('keyword', query || '');
        queryParams.append('classificationName', 'music');
        queryParams.append('size', '50');
        queryParams.append('sort', 'date,asc');
        break;
      case 'events':
        // Handle custom parameters for events endpoint
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value.toString());
          });
        }
        break;
      case 'featured':
        queryParams.append('classificationName', 'music');
        queryParams.append('size', '20');
        queryParams.append('sort', 'relevance,desc');
        queryParams.append('includeTBA', 'no');
        queryParams.append('includeTBD', 'no');
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    apiUrl += queryParams.toString();
    console.log('Making request to:', apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ticketmaster API error:', errorText);
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received response with data:', data._embedded?.events?.length || 0, 'events');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ticketmaster function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
