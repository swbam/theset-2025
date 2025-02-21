export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      anonymous_votes: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          song_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          song_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          song_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "setlist_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_vote_counts"
            referencedColumns: ["song_id"]
          },
        ]
      }
      artist_identifiers: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          last_synced_at: string | null
          platform: string
          platform_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          platform: string
          platform_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: string
          platform_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_identifiers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          classifications: Json | null
          cover_image_url: string | null
          created_at: string | null
          genres: Json | null
          id: string
          image_url: string | null
          last_synced_at: string | null
          metadata: Json | null
          name: string
          spotify_id: string | null
          ticketmaster_id: string | null
          updated_at: string | null
        }
        Insert: {
          classifications?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          genres?: Json | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          metadata?: Json | null
          name: string
          spotify_id?: string | null
          ticketmaster_id?: string | null
          updated_at?: string | null
        }
        Update: {
          classifications?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          genres?: Json | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string
          spotify_id?: string | null
          ticketmaster_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cached_shows: {
        Row: {
          artist_id: string
          date: string | null
          id: string
          last_synced_at: string | null
          name: string
          platform_id: string
          price_ranges: Json | null
          status: string | null
          ticket_url: string | null
          ticketmaster_id: string | null
          venue_id: string | null
          venue_location: string | null
          venue_name: string | null
        }
        Insert: {
          artist_id: string
          date?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          platform_id: string
          price_ranges?: Json | null
          status?: string | null
          ticket_url?: string | null
          ticketmaster_id?: string | null
          venue_id?: string | null
          venue_location?: string | null
          venue_name?: string | null
        }
        Update: {
          artist_id?: string
          date?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          platform_id?: string
          price_ranges?: Json | null
          status?: string | null
          ticket_url?: string | null
          ticketmaster_id?: string | null
          venue_id?: string | null
          venue_location?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cached_shows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cached_shows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      cached_songs: {
        Row: {
          album: string | null
          artist_id: string
          id: string
          last_synced_at: string | null
          name: string
          platform_id: string
          popularity: number | null
          preview_url: string | null
        }
        Insert: {
          album?: string | null
          artist_id: string
          id?: string
          last_synced_at?: string | null
          name: string
          platform_id: string
          popularity?: number | null
          preview_url?: string | null
        }
        Update: {
          album?: string | null
          artist_id?: string
          id?: string
          last_synced_at?: string | null
          name?: string
          platform_id?: string
          popularity?: number | null
          preview_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cached_songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      setlist_songs: {
        Row: {
          created_at: string | null
          id: string
          is_top_track: boolean | null
          setlist_id: string
          song_name: string
          spotify_id: string | null
          suggested: boolean | null
          votes: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_top_track?: boolean | null
          setlist_id: string
          song_name: string
          spotify_id?: string | null
          suggested?: boolean | null
          votes?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_top_track?: boolean | null
          setlist_id?: string
          song_name?: string
          spotify_id?: string | null
          suggested?: boolean | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          show_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          show_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          show_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setlists_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "cached_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_events: {
        Row: {
          artist_id: string | null
          check_period: unknown | null
          error: string | null
          id: string
          platform: string
          status: string | null
          success: boolean
          timestamp: string | null
          type: string
        }
        Insert: {
          artist_id?: string | null
          check_period?: unknown | null
          error?: string | null
          id?: string
          platform: string
          status?: string | null
          success: boolean
          timestamp?: string | null
          type: string
        }
        Update: {
          artist_id?: string | null
          check_period?: unknown | null
          error?: string | null
          id?: string
          platform?: string
          status?: string | null
          success?: boolean
          timestamp?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_metrics: {
        Row: {
          average_sync_duration: unknown | null
          created_at: string | null
          error_count: number | null
          error_events: number | null
          id: string
          last_sync_time: string | null
          platform: string
          status: string | null
          success_count: number | null
          total_events: number | null
          updated_at: string | null
        }
        Insert: {
          average_sync_duration?: unknown | null
          created_at?: string | null
          error_count?: number | null
          error_events?: number | null
          id?: string
          last_sync_time?: string | null
          platform: string
          status?: string | null
          success_count?: number | null
          total_events?: number | null
          updated_at?: string | null
        }
        Update: {
          average_sync_duration?: unknown | null
          created_at?: string | null
          error_count?: number | null
          error_events?: number | null
          id?: string
          last_sync_time?: string | null
          platform?: string
          status?: string | null
          success_count?: number | null
          total_events?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_artists: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_votes: {
        Row: {
          created_at: string | null
          id: string
          song_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          song_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          song_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "setlist_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_vote_counts"
            referencedColumns: ["song_id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string
          country: string | null
          created_at: string | null
          display_location: string | null
          display_name: string | null
          id: string
          last_synced_at: string | null
          name: string
          state: string | null
          ticketmaster_id: string
          venue_image_url: string | null
        }
        Insert: {
          capacity?: number | null
          city: string
          country?: string | null
          created_at?: string | null
          display_location?: string | null
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          state?: string | null
          ticketmaster_id: string
          venue_image_url?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string
          country?: string | null
          created_at?: string | null
          display_location?: string | null
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          state?: string | null
          ticketmaster_id?: string
          venue_image_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      song_vote_counts: {
        Row: {
          last_vote_at: string | null
          setlist_id: string | null
          song_id: string | null
          total_votes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cast_vote: {
        Args: {
          p_song_id: string
          p_user_id?: string
          p_ip_address?: string
        }
        Returns: undefined
      }
      check_sync_health: {
        Args: {
          platform: string
        }
        Returns: {
          health_status: string
          last_sync: string
          error_rate: number
        }[]
      }
      needs_artist_refresh: {
        Args: {
          last_sync: string
          ttl_hours?: number
        }
        Returns: boolean
      }
      needs_venue_refresh: {
        Args: {
          last_sync: string
          ttl_hours?: number
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
