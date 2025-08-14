// World-class Ticketmaster API proxy with enterprise-grade features
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import { 
  RateLimiter, 
  CircuitBreaker, 
  RetryHandler, 
  Logger, 
  PerformanceMonitor,
  isRetryableError,
  createApiResponse
} from '../_shared/utils.ts';

// Constants
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Global instances
const logger = Logger.getInstance().setContext('TICKETMASTER');
const performanceMonitor = new PerformanceMonitor();
const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 1000,
  retryAfterMs: 200
});
const circuitBreaker = new CircuitBreaker(5, 60000, 10000);
const retryHandler = new RetryHandler(MAX_RETRIES, 1000, 30000);

interface TicketmasterRequest {
  endpoint: 'search' | 'artist-events' | 'events' | 'venues' | 'featured' | 'health';
  query?: string;
  params?: Record<string, string | number>;
  venueId?: string;
}

async function getApiKey(supabaseClient: any): Promise<string> {
  const { data, error } = await supabaseClient
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .single();

  if (error) {
    throw new Error(`API key retrieval failed: ${error.message}`);
  }

  if (!data?.value) {
    throw new Error('Ticketmaster API key not found in secrets table');
  }

  return data.value;
}

function buildApiUrl(endpoint: string, query?: string, params?: Record<string, any>, apiKey?: string): string {
  const queryParams = new URLSearchParams();
  
  if (apiKey) {
    queryParams.append('apikey', apiKey);
  }
  
  let url: string;
  
  switch (endpoint) {
    case 'artist-events':
      if (query) queryParams.append('keyword', query);
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'date,asc');
      queryParams.append('size', '50');
      url = `${TICKETMASTER_BASE_URL}/events.json`;
      break;
      
    case 'search':
      if (query) queryParams.append('keyword', query);
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'relevance,desc');
      queryParams.append('size', '50');
      url = `${TICKETMASTER_BASE_URL}/events.json`;
      break;
      
    case 'events':
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'date,asc');
      queryParams.append('size', '50');
      url = `${TICKETMASTER_BASE_URL}/events.json`;
      break;
      
    case 'venues':
      if (!query) {
        throw new Error('Venue ID is required for venues endpoint');
      }
      return `${TICKETMASTER_BASE_URL}/venues/${query}.json?apikey=${apiKey}`;
      
    case 'featured':
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'relevance,desc');
      queryParams.append('countryCode', params?.countryCode?.toString() || 'US');
      queryParams.append('size', params?.size?.toString() || '50');
      
      const now = new Date();
      const future = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000));
      queryParams.append('startDateTime', now.toISOString().replace(/\.\d{3}Z$/, 'Z'));
      queryParams.append('endDateTime', future.toISOString().replace(/\.\d{3}Z$/, 'Z'));
      url = `${TICKETMASTER_BASE_URL}/events.json`;
      break;
      
    case 'health':
      queryParams.append('classificationName', 'music');
      queryParams.append('size', '1');
      url = `${TICKETMASTER_BASE_URL}/events.json`;
      break;
      
    default:
      throw new Error(`Invalid endpoint: ${endpoint}`);
  }
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'apikey' && value !== undefined && value !== null && !queryParams.has(key)) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  return `${url}?${queryParams.toString()}`;
}

async function makeTicketmasterRequest(url: string, timeout = DEFAULT_TIMEOUT): Promise<any> {
  return await retryHandler.execute(
    async () => {
      await rateLimiter.acquire();
      
      return await circuitBreaker.execute(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TheSet/1.0 Concert Setlist Voting App'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }
          
          return await response.json();
        } finally {
          clearTimeout(timeoutId);
        }
      });
    },
    isRetryableError
  );
}

async function handleTicketmasterRequest(request: TicketmasterRequest, supabaseClient: any) {
  const apiKey = await getApiKey(supabaseClient);
  const url = buildApiUrl(request.endpoint, request.query, request.params, apiKey);
  const data = await makeTicketmasterRequest(url);
  
  return createApiResponse(true, data);
}

// Main Handler
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }
  
  try {
    let requestBody: TicketmasterRequest;
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      requestBody = await req.json();
    } else {
      const text = await req.text();
      try {
        requestBody = JSON.parse(text || '{}');
      } catch {
        requestBody = { endpoint: 'search' };
      }
    }
    
    if (!requestBody.endpoint) {
      return createCorsResponse(
        createApiResponse(false, undefined, 'Missing required field: endpoint'),
        400
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const result = await handleTicketmasterRequest(requestBody, supabaseClient);
    
    return createCorsResponse(result, result.success ? 200 : 500);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorResponse = createApiResponse(false, undefined, errorMessage);
    return createCorsResponse(errorResponse, 500);
  }
});