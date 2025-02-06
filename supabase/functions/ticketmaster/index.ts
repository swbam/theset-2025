
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const searchQuery = url.searchParams.get('q');

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
      throw new Error('Ticketmaster API key not found');
    }

    let apiUrl = `${BASE_URL}`;
    
    switch (endpoint) {
      case 'search':
        apiUrl += `/events.json?keyword=${encodeURIComponent(searchQuery || '')}&classificationName=music&size=20&sort=date,asc`;
        break;
      case 'artist':
        apiUrl += `/events.json?keyword=${encodeURIComponent(searchQuery || '')}&classificationName=music&size=50&sort=date,asc`;
        break;
      case 'featured':
        apiUrl += `/events.json?classificationName=music&size=20&sort=relevance,desc&includeTBA=no&includeTBD=no`;
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    apiUrl += `&apikey=${secretData.value}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
