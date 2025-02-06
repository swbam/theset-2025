
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, query } = await req.json();
    console.log(`Processing ${endpoint} request with query:`, query);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('key', 'TICKETMASTER_API_KEY')
      .maybeSingle();

    if (secretError || !secretData?.value) {
      console.error('Failed to get API key:', secretError);
      throw new Error('Ticketmaster API key not found');
    }

    let apiUrl = `${BASE_URL}`;
    
    switch (endpoint) {
      case 'search':
        apiUrl += `/events.json?keyword=${encodeURIComponent(query)}&classificationName=music&size=20&sort=date,asc`;
        break;
      case 'artist':
        apiUrl += `/events.json?keyword=${encodeURIComponent(query)}&classificationName=music&size=50&sort=date,asc`;
        break;
      case 'featured':
        apiUrl += `/events.json?classificationName=music&size=20&sort=relevance,desc&includeTBA=no&includeTBD=no`;
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    apiUrl += `&apikey=${secretData.value}`;
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
