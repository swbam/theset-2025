// Enterprise-grade CORS configuration with security best practices

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://nxeokwzotcrumtywdnvd.supabase.co,https://app.lovable.dev'
    : '*',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Access-Control-Allow-Credentials': 'true',
  'Vary': 'Origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export function createCorsResponse(data?: unknown, status: number = 200): Response {
  return new Response(
    data ? JSON.stringify(data) : null,
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

export function handleCorsPreFlight(): Response {
  return new Response('ok', { 
    headers: corsHeaders,
    status: 200
  });
}