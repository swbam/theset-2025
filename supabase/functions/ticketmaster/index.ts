// World-class Ticketmaster API proxy with enterprise-grade features
// Supports intelligent rate limiting, circuit breakers, and comprehensive error handling

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleCorsPreFlight, createCorsResponse } from '../_shared/cors.ts';
import { 
  RateLimiter, 
  CircuitBreaker, 
  RetryHandler, 
  Logger, 
  PerformanceMonitor,
  isRetryableError,
  createApiResponse,
  sleep
} from '../_shared/utils.ts';
import type { 
  TicketmasterEvent, 
  TicketmasterVenue, 
  TicketmasterArtist,
  ApiResponse
} from '../_shared/types.ts';

// Constants
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
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

// Enhanced Request Interface
interface TicketmasterRequest {
  endpoint: 'search' | 'artist' | 'events' | 'venues' | 'featured' | 'health';
  query?: string;
  params?: Record<string, string | number>;
  options?: {
    timeout?: number;
    retries?: number;
    rateLimitBypass?: boolean;
  };
}

// Enhanced API Key Management
async function getApiKey(supabaseClient: SupabaseClient): Promise<string> {
  const endTimer = performanceMonitor.startTimer('get_api_key');
  
  try {
    const { data, error } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('key', 'TICKETMASTER_API_KEY')
      .single();

    if (error) {
      logger.error('Failed to retrieve API key from secrets', { error });
      throw new Error(`API key retrieval failed: ${error.message}`);
    }

    if (!data?.value) {
      throw new Error('Ticketmaster API key not found in secrets table');
    }

    return data.value;
  } finally {
    endTimer();
  }
}

// Smart URL Builder with Validation - FIXED to prevent duplicate parameters
function buildApiUrl(endpoint: string, query?: string, params?: Record<string, any>, apiKey?: string): string {
  const queryParams = new URLSearchParams();
  
  if (apiKey) {
    queryParams.append('apikey', apiKey);
  }
  
  let url: string;
  
  switch (endpoint) {
    case 'search':
      // Search for artists specifically
      if (query) queryParams.append('keyword', query);
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'relevance,desc');
      queryParams.append('size', '50');
      url = `${TICKETMASTER_BASE_URL}/events.json`;
      break;
      
    case 'artist':
      // Search for events by artist name
      if (query) queryParams.append('keyword', query);
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'date,asc');
      queryParams.append('size', '100');
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
      // For venues, we use a direct path without query parameters
      return `${TICKETMASTER_BASE_URL}/venues/${query}.json?apikey=${apiKey}`;
      
    case 'featured':
      const now = new Date();
      // Remove milliseconds for Ticketmaster API compatibility
      const startDateTime = now.toISOString().split('.')[0] + 'Z';
      queryParams.append('startDateTime', startDateTime);
      queryParams.append('classificationName', 'music');
      queryParams.append('sort', 'relevance,desc');
      queryParams.append('countryCode', 'US');
      queryParams.append('size', '50');
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
  
  // Apply additional parameters ONLY if they don't conflict with existing ones
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'apikey' && value !== undefined && value !== null && !queryParams.has(key)) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  return `${url}?${queryParams.toString()}`;
}

// Enhanced HTTP Client with Advanced Features
async function makeTicketmasterRequest(
  url: string, 
  options: { timeout?: number; retries?: number } = {}
): Promise<any> {
  const endTimer = performanceMonitor.startTimer('ticketmaster_request');
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  
  try {
    return await retryHandler.execute(
      async () => {
        // Apply rate limiting
        await rateLimiter.acquire();
        
        // Use circuit breaker for fault tolerance
        return await circuitBreaker.execute(async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          try {
            logger.debug('Making request to Ticketmaster API', { url });
            
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
              logger.warn('Ticketmaster API error response', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
              });
              
              throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            logger.debug('Successful Ticketmaster API response', {
              eventCount: data._embedded?.events?.length || 0,
              pageInfo: data.page
            });
            
            return data;
          } finally {
            clearTimeout(timeoutId);
          }
        });
      },
      isRetryableError
    );
  } catch (error) {
    logger.error('Ticketmaster request failed after retries', { 
      url, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    endTimer();
  }
}

// Data Transformation and Validation
function validateAndTransformResponse(data: any, endpoint: string): unknown {
  if (!data) {
    throw new Error('Empty response from Ticketmaster API');
  }
  
  // Validate structure based on endpoint
  switch (endpoint) {
    case 'events':
    case 'search':
    case 'artist':
    case 'featured':
      if (!data._embedded && !data.page) {
        logger.warn('Unexpected response structure', { data });
      }
      break;
      
    case 'venues':
      if (!data.id && !data.name) {
        throw new Error('Invalid venue data structure');
      }
      break;
  }
  
  return data;
}

// Health Check Endpoint
async function performHealthCheck(supabaseClient: SupabaseClient): Promise<ApiResponse> {
  const endTimer = performanceMonitor.startTimer('health_check');
  
  try {
    const apiKey = await getApiKey(supabaseClient);
    const healthUrl = buildApiUrl('health', undefined, undefined, apiKey);
    
    const startTime = performance.now();
    const data = await makeTicketmasterRequest(healthUrl, { timeout: 10000 });
    const responseTime = performance.now() - startTime;
    
    return createApiResponse(true, {
      status: 'healthy',
      responseTime: Math.round(responseTime),
      apiConnectivity: 'ok'
    });
  } catch (error) {
    return createApiResponse(false, undefined, `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    endTimer();
  }
}

// Main Request Handler
async function handleTicketmasterRequest(request: TicketmasterRequest, supabaseClient: SupabaseClient): Promise<ApiResponse> {
  const endTimer = performanceMonitor.startTimer(`endpoint_${request.endpoint}`);
  
  try {
    logger.info('Processing Ticketmaster request', {
      endpoint: request.endpoint,
      query: request.query,
      params: request.params
    });
    
    // Handle health check separately
    if (request.endpoint === 'health') {
      return await performHealthCheck(supabaseClient);
    }
    
    // Get API key
    const apiKey = await getApiKey(supabaseClient);
    
    // Build URL
    const url = buildApiUrl(request.endpoint, request.query, request.params, apiKey);
    
    // Make request
    const data = await makeTicketmasterRequest(url, request.options);
    
    // Validate and transform response
    const validatedData = validateAndTransformResponse(data, request.endpoint);
    
    const executionTime = endTimer();
    
    return createApiResponse(true, validatedData, undefined, {
      executionTime: Math.round(executionTime)
    });
    
  } catch (error) {
    const executionTime = endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logger.error('Request processing failed', {
      endpoint: request.endpoint,
      error: errorMessage,
      executionTime: Math.round(executionTime)
    });
    
    return createApiResponse(false, undefined, errorMessage, {
      executionTime: Math.round(executionTime)
    });
  }
}

// Main Deno.serve Handler
Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = performance.now();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }
  
  try {
    // Parse request body
    const requestBody: TicketmasterRequest = await req.json();
    
    // Validate request
    if (!requestBody.endpoint) {
      return createCorsResponse(
        createApiResponse(false, undefined, 'Missing required field: endpoint'),
        400
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Process request
    const result = await handleTicketmasterRequest(requestBody, supabaseClient);
    
    // Add total execution time
    result.executionTime = Math.round(performance.now() - startTime);
    
    return createCorsResponse(result, result.success ? 200 : 500);
    
  } catch (error) {
    const totalTime = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    logger.error('Request handler error', {
      error: errorMessage,
      totalTime
    });
    
    const errorResponse = createApiResponse(false, undefined, errorMessage, {
      executionTime: totalTime
    });
    
    return createCorsResponse(errorResponse, 500);
  }
});