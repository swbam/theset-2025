import { callTicketmasterFunction } from "./api";

// Function to search for artists
export const searchArtists = async (query: string) => {
  try {
    const response = await callTicketmasterFunction('attractions', undefined, {
      size: '10',
      sort: 'relevance,desc',
      keyword: query,
      countryCode: 'US'
    });

    return response?._embedded?.attractions || [];
  } catch (error) {
    console.error('Error searching for artists:', error);
    return [];
  }
};
