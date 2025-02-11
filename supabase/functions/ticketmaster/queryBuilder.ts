
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
}

export function buildQueryParams(endpoint: string, query?: string, params?: any): URLSearchParams {
  const queryParams = new URLSearchParams({
    apikey: params.apikey,
    classificationName: 'music',
  });

  // Handle date parameters
  if (params?.startDate && params?.endDate) {
    try {
      queryParams.set('startDateTime', new Date(params.startDate).toISOString().split('.')[0] + 'Z');
      queryParams.set('endDateTime', new Date(params.endDate).toISOString().split('.')[0] + 'Z');
      console.log('Using dates:', queryParams.toString());
    } catch (error) {
      console.error('Error formatting date range:', error);
      throw error;
    }
  }

  // Endpoint-specific parameters
  switch (endpoint) {
    case 'topShows':
      queryParams.append('sort', 'relevance,desc');
      queryParams.append('size', '50');
      queryParams.append('includeTest', 'no');
      queryParams.append('includeTBA', 'no');
      queryParams.append('includeTBD', 'no');
      queryParams.append('segmentId', 'KZFzniwnSyZfZ7v7nJ');
      break;
    case 'search':
      if (query) {
        queryParams.append('keyword', query);
      }
      queryParams.append('sort', 'date,asc');
      break;
    case 'artist':
      if (query) {
        queryParams.append('keyword', query);
      }
      queryParams.append('sort', 'date,asc');
      queryParams.append('size', '50');
      break;
    case 'events':
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (key !== 'apikey' && key !== 'startDate' && key !== 'endDate' && value) {
            queryParams.append(key, value.toString());
          }
        });
      }
      if (!params?.sort) {
        queryParams.append('sort', 'date,asc');
      }
      break;
  }

  // Set size parameter if not already set
  if (!queryParams.has('size')) {
    queryParams.append('size', '20');
  }

  return queryParams;
}
