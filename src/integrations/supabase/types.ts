export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name: string
          created_at: string | null
          updated_at: string | null
          metadata: Json | null
          image_url: string | null
          cover_image_url: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
          image_url?: string | null
          cover_image_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
          image_url?: string | null
          cover_image_url?: string | null
        }
        Relationships: []
      }
      artist_identifiers: {
        Row: {
          id: string
          artist_id: string
          platform: 'spotify' | 'ticketmaster'
          platform_id: string
          last_synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          platform: 'spotify' | 'ticketmaster'
          platform_id: string
          last_synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          platform?: 'spotify' | 'ticketmaster'
          platform_id?: string
          last_synced_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_artist_identifiers_artist"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      sync_events: {
        Row: {
          id: string
          type: 'artist_sync' | 'platform_link' | 'identifier_update'
          status: 'success' | 'error'
          platform: 'spotify' | 'ticketmaster'
          artist_id: string | null
          platform_id: string | null
          error: string | null
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          type: 'artist_sync' | 'platform_link' | 'identifier_update'
          status: 'success' | 'error'
          platform: 'spotify' | 'ticketmaster'
          artist_id?: string | null
          platform_id?: string | null
          error?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          type?: 'artist_sync' | 'platform_link' | 'identifier_update'
          status?: 'success' | 'error'
          platform?: 'spotify' | 'ticketmaster'
          artist_id?: string | null
          platform_id?: string | null
          error?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      cached_shows: {
        Row: {
          id: string
          artist_id: string
          name: string
          date: string
          platform_id: string | null
          venue_id: string | null
          venue_name: string | null
          venue_location: Json | null
          price_ranges: Json | null
          ticket_url: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          artist_id: string
          name: string
          date: string
          platform_id?: string | null
          venue_id?: string | null
          venue_name?: string | null
          venue_location?: Json | null
          price_ranges?: Json | null
          ticket_url?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          artist_id?: string
          name?: string
          date?: string
          platform_id?: string | null
          venue_id?: string | null
          venue_name?: string | null
          venue_location?: Json | null
          price_ranges?: Json | null
          ticket_url?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cached_shows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      cached_songs: {
        Row: {
          id: string
          artist_id: string | null
          name: string
          platform_id: string | null
          album: string | null
          popularity: number | null
          preview_url: string | null
          created_at: string | null
          updated_at: string | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          artist_id?: string | null
          name: string
          platform_id?: string | null
          album?: string | null
          popularity?: number | null
          preview_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          artist_id?: string | null
          name?: string
          platform_id?: string | null
          album?: string | null
          popularity?: number | null
          preview_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cached_songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      sync_health_metrics: {
        Row: {
          time_bucket: string
          total_events: number
          successful_events: number
          error_events: number
          error_rate: number
        }
      }
    }
    Functions: {
      check_sync_health: {
        Args: {
          check_period?: string
        }
        Returns: {
          status: string
          error_rate: number
          total_events: number
          error_events: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
