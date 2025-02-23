
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY');
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callTicketmasterAPI(endpoint: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    ...params,
    apikey: TICKETMASTER_API_KEY!,
  });

  const url = `${TICKETMASTER_BASE_URL}/${endpoint}.json?${searchParams}`;
  
  console.log('Calling Ticketmaster API:', url);

  const response = await fetch(url);
  
  if (!response.ok) {
    console.error('Ticketmaster API error:', {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`Ticketmaster API error: ${response.statusText}`);
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key not configured');
    }

    const { endpoint, params } = await req.json();

    if (!endpoint) {
      throw new Error('No endpoint specified');
    }

    console.log('Processing request:', { endpoint, params });

    let response;
    switch (endpoint) {
      case 'events':
        response = await callTicketmasterAPI('events', {
          size: params.size || '20',
          sort: params.sort || 'date,asc',
          ...(params.classificationName && { classificationName: params.classificationName }),
          ...(params.keyword && { keyword: params.keyword }),
          ...(params.venueId && { venueId: params.venueId })
        });
        break;

      case 'search':
        response = await callTicketmasterAPI('events', {
          keyword: params.keyword,
          size: params.size || '100',
          sort: 'relevance,desc'
        });
        break;

      default:
        throw new Error(`Invalid endpoint: ${endpoint}`);
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
