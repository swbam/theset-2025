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
      platform_identifiers: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          last_synced_at: string | null
          metadata: Json | null
          platform: string
          platform_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          platform: string
          platform_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          platform?: string
          platform_id?: string
        }
        Relationships: []
      }
      setlists: {
        Row: {
          created_at: string | null
          id: string
          show_id: string
          songs: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          show_id: string
          songs?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          show_id?: string
          songs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "setlist_show_fk"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlists_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          artist_id: string
          created_at: string | null
          date: string
          id: string
          status: string | null
          ticket_url: string | null
          ticketmaster_id: string
          venue_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          date: string
          id?: string
          status?: string | null
          ticket_url?: string | null
          ticketmaster_id: string
          venue_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          date?: string
          id?: string
          status?: string | null
          ticket_url?: string | null
          ticketmaster_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_artist_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_venue_fk"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          spotify_id: string
          title: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          spotify_id: string
          title: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          spotify_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_artist_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_events: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          platform: string
          status: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          status: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          status?: string
        }
        Relationships: []
      }
      sync_metrics: {
        Row: {
          created_at: string | null
          error_count: number | null
          id: string
          last_sync_time: string | null
          platform: string
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_sync_time?: string | null
          platform: string
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
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
      users: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          spotify_id: string | null
          top_artists: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          spotify_id?: string | null
          top_artists?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          spotify_id?: string | null
          top_artists?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          ticketmaster_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          ticketmaster_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          ticketmaster_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          show_id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          show_id: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          show_id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_show_fk"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_song_fk"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
      needs_sync: {
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
      update_sync_metrics: {
        Args: {
          p_platform: string
          p_success: boolean
          p_error_message?: string
        }
        Returns: undefined
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
