
import { callTicketmasterApi } from "./api";

export const searchArtist = async (query: string) => {
  try {
    const response = await callTicketmasterApi('search', {
      keyword: query,
      classificationName: 'music'
    });
    
    return response._embedded?.events || [];
  } catch (error) {
    console.error('Error searching artist:', error);
    throw error;
  }
};
