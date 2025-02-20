interface QueryParams {
  apikey: string;
  startDateTime?: string;
  endDateTime?: string;
  keyword?: string;
  sort?: string;
  size?: string;
  includeTest?: string;
  includeTBA?: string;
  includeTBD?: string;
  segmentId?: string;
  classificationName?: string;
  countryCode?: string;
  radius?: string;
  unit?: string;
  preferredCountry?: string;
}

interface EndpointParams {
  apikey: string;
  startDateTime?: string;
  endDateTime?: string;
  keyword?: string;
  sort?: string;
  size?: string;
  countryCode?: string;
  classificationName?: string;
  [key: string]: string | undefined;
}

function getDateRange(months: number): { startDateTime: string; endDateTime: string } {
  const now = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + months);

  return {
    startDateTime: now.toISOString().split('.')[0] + 'Z',
    endDateTime: future.toISOString().split('.')[0] + 'Z'
  };
}

export function buildQueryParams(
  endpoint: 'popularShows' | 'search' | 'artistEvents' | 'events',
  query?: string,
  params: EndpointParams = { apikey: '' }
): URLSearchParams {
  const queryParams = new URLSearchParams({
    apikey: params.apikey,
  });

  // Common parameters for all music-related queries
  queryParams.append('classificationName', 'music');
  queryParams.append('segmentId', 'KZFzniwnSyZfZ7v7nJ'); // Music segment ID
  queryParams.append('includeTest', 'no');
  queryParams.append('includeTBA', 'no');
  queryParams.append('includeTBD', 'no');
  queryParams.append('preferredCountry', 'us');

  // Handle date parameters
  if (params?.startDateTime) {
    queryParams.append('startDateTime', params.startDateTime);
  }

  // Endpoint-specific parameters
  switch (endpoint) {
    case 'popularShows': {
      const { startDateTime, endDateTime } = getDateRange(6); // 6 months
      queryParams.append('sort', 'date,asc');
      queryParams.append('size', '200'); // Get more shows to filter from
      queryParams.append('countryCode', params?.countryCode || 'US');
      queryParams.append('radius', '1500'); // Large radius to get more results
      queryParams.append('unit', 'miles');
      
      // Add date range if not provided
      if (!params?.startDateTime) {
        queryParams.append('startDateTime', startDateTime);
      }
      queryParams.append('endDateTime', endDateTime);
      break;
    }

    case 'search': {
      if (query) {
        queryParams.append('keyword', query);
        queryParams.append('sort', 'relevance,desc');
        queryParams.append('size', '100');
        queryParams.append('radius', '1500');
        queryParams.append('unit', 'miles');
        queryParams.append('countryCode', 'US');
      }
      break;
    }

    case 'artistEvents': {
      const { startDateTime, endDateTime } = getDateRange(12); // 12 months
      if (query) {
        queryParams.append('keyword', query);
        queryParams.append('sort', 'date,asc');
        queryParams.append('size', '100');
        queryParams.append('radius', '1500');
        queryParams.append('unit', 'miles');
        queryParams.append('countryCode', 'US');
      }
      // Add date range if not provided
      if (!params?.startDateTime) {
        queryParams.append('startDateTime', startDateTime);
      }
      queryParams.append('endDateTime', endDateTime);
      break;
    }

    case 'events': {
      // Handle all custom parameters
      Object.entries(params).forEach(([key, value]) => {
        if (
          key !== 'apikey' && 
          value !== undefined && 
          value !== null && 
          value !== ''
        ) {
          queryParams.append(key, value.toString());
        }
      });
      
      // Set default sort if not provided
      if (!queryParams.has('sort')) {
        queryParams.append('sort', 'date,asc');
      }
      
      // Set default size if not provided
      if (!queryParams.has('size')) {
        queryParams.append('size', '20');
      }
      break;
    }
  }

  // Log the final query parameters (excluding API key)
  const logParams = new URLSearchParams(queryParams);
  logParams.delete('apikey');
  console.log(`Query parameters for ${endpoint}:`, logParams.toString());

  return queryParams;
}
