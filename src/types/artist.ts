
export interface Artist {
  id: string;
  spotify_id?: string;
  ticketmaster_id?: string;
  name: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
