
import { supabase } from "@/integrations/supabase/client";
import type { TicketmasterEvent } from "./types";

export const callTicketmasterFunction = async (endpoint: string, query?: string, params?: Record<string, string>) => {
  console.log(`Calling Ticketmaster API - ${endpoint}:`, { query, params });
  
  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, query, params },
  });

  if (error) {
    console.error('Error calling Ticketmaster function:', error);
    throw error;
  }

  return data?._embedded?.events || [];
};

export const fetchFromCache = async (artistId: string | null, ttlHours = 24) => {
  if (!artistId) return [];
  
  const { data: shows, error } = await supabase
    .from('cached_shows')
    .select(`
      *,
      venue:venues(
        id,
        name,
        city,
        state,
        country,
        address
      )
    `)
    .eq('artist_id', artistId)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }

  // Check if we need to refresh the cache
  const { data: needsRefresh } = await supabase
    .rpc('needs_refresh', { 
      last_sync: shows?.[0]?.last_synced_at,
      ttl_hours: ttlHours 
    });

  return needsRefresh ? null : shows;
};

