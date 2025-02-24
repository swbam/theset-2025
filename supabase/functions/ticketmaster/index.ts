// deno-lint-ignore-file no-explicit-any
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const { endpoint, query, params } = await req.json();
    console.log(`Processing ${endpoint} request:`, { query, params });

    const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Ticketmaster API key');
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      apikey: apiKey,
      ...params,
      classificationName: 'music',
      countryCode: 'US',
      segmentId: 'KZFzniwnSyZfZ7v7nJ', // Music segment ID
      size: '100'
    });

    if (query) {
      queryParams.set('keyword', query);
    }

    const apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;
    console.log('Making request to:', apiUrl.replace(apiKey, '[REDACTED]'));

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ticketmaster API error:', response.status, errorText);
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response:', {
      page: data.page,
      totalElements: data.totalElements,
      events: data._embedded?.events?.length || 0
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ticketmaster function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
