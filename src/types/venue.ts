
export interface Venue {
  id: string;
  ticketmaster_id: string;
  name: string;
  metadata?: Record<string, any>;
  created_at?: string;
}
