
import { supabase } from "@/integrations/supabase/client";

export async function callTicketmasterFunction(
  endpoint: string,
  query?: string,
  params?: Record<string, any>
) {
  try {
    const { data, error } = await supabase.functions.invoke('ticketmaster', {
      body: { endpoint, query, params }
    });

    if (error) {
      console.error('Error calling Ticketmaster function:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in callTicketmasterFunction:', error);
    throw error;
  }
}
