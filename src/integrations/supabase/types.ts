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
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
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
          status: string | null
          ticket_url: string | null
          venue_name: string | null
        }
        Insert: {
          artist_id: string
          date?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          platform_id: string
          status?: string | null
          ticket_url?: string | null
          venue_name?: string | null
        }
        Update: {
          artist_id?: string
          date?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          platform_id?: string
          status?: string | null
          ticket_url?: string | null
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
          votes: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_top_track?: boolean | null
          setlist_id: string
          song_name: string
          votes?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_top_track?: boolean | null
          setlist_id?: string
          song_name?: string
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
          id: string
          name: string
          show_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          show_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
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
          error: string | null
          id: string
          platform: string
          success: boolean
          timestamp: string | null
          type: string
        }
        Insert: {
          error?: string | null
          id?: string
          platform: string
          success: boolean
          timestamp?: string | null
          type: string
        }
        Update: {
          error?: string | null
          id?: string
          platform?: string
          success?: boolean
          timestamp?: string | null
          type?: string
        }
        Relationships: []
      }
      sync_metrics: {
        Row: {
          average_sync_duration: unknown | null
          created_at: string | null
          error_count: number | null
          id: string
          last_sync_time: string | null
          platform: string
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          average_sync_duration?: unknown | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_sync_time?: string | null
          platform: string
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
          average_sync_duration?: unknown | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_sync_time?: string | null
          platform?: string
          success_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      needs_artist_refresh: {
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
