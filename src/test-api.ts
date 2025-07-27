// Quick test to see what's happening with the API calls
import { callTicketmasterFunction } from "@/integrations/ticketmaster/api";

export const testTicketmasterAPI = async () => {
  try {
    console.log('Testing Ticketmaster API...');
    const result = await callTicketmasterFunction('events', undefined, {
      classificationName: 'music',
      size: '5'
    });
    console.log('API Response:', result);
    return result;
  } catch (error) {
    console.error('API Test Error:', error);
    return [];
  }
};
