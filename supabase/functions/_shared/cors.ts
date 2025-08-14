// Enterprise-grade CORS configuration with security best practices

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

/**
 * Helper to build a JSON Response with the project-wide CORS headers plus an
 * optional `Cache-Control` directive so individual edge-functions can opt into
 * short-term public caching (CDN & browser).
 */
export function createCorsResponse(
  data?: unknown,
  status: number = 200,
  cacheSeconds = 0
): Response {
  const headers: Record<string, string> = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, max-age=${cacheSeconds}, stale-while-revalidate=60`;
  }

  return new Response(data ? JSON.stringify(data) : null, {
    status,
    headers,
  });
}

export function handleCorsPreFlight(): Response {
  return new Response('ok', { 
    headers: corsHeaders,
    status: 200
  });
}