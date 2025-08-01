export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
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
      cached_shows: {
        Row: {
          artist_id: string
          created_at: string | null
          date: string
          id: string
          last_synced_at: string | null
          name: string
          ticket_url: string | null
          ticketmaster_id: string
          venue_location: Json | null
          venue_name: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          date: string
          id?: string
          last_synced_at?: string | null
          name: string
          ticket_url?: string | null
          ticketmaster_id: string
          venue_location?: Json | null
          venue_name?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          date?: string
          id?: string
          last_synced_at?: string | null
          name?: string
          ticket_url?: string | null
          ticketmaster_id?: string
          venue_location?: Json | null
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
            foreignKeyName: "fk_cached_shows_artist_id"
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
          created_at: string | null
          id: string
          last_synced_at: string | null
          name: string
          popularity: number | null
          preview_url: string | null
          spotify_id: string
        }
        Insert: {
          album?: string | null
          artist_id: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          popularity?: number | null
          preview_url?: string | null
          spotify_id: string
        }
        Update: {
          album?: string | null
          artist_id?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          popularity?: number | null
          preview_url?: string | null
          spotify_id?: string
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
      guest_actions: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string
          id: string
          ip_address: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id: string
          id?: string
          ip_address: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          spotify_data: Json | null
          spotify_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          spotify_data?: Json | null
          spotify_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          spotify_data?: Json | null
          spotify_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string | null
          id: number
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      setlist_songs: {
        Row: {
          artist_id: string | null
          created_at: string | null
          id: string
          order_index: number | null
          setlist_id: string
          song_id: string | null
          song_name: string
          spotify_id: string | null
          suggested: boolean | null
          total_votes: number | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          setlist_id: string
          song_id?: string | null
          song_name: string
          spotify_id?: string | null
          suggested?: boolean | null
          total_votes?: number | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          setlist_id?: string
          song_id?: string | null
          song_name?: string
          spotify_id?: string | null
          suggested?: boolean | null
          total_votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_setlists_show_id"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "cached_shows"
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
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
      song_votes: {
        Row: {
          created_at: string | null
          id: string
          setlist_song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setlist_song_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setlist_song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_votes_setlist_song_id_fkey"
            columns: ["setlist_song_id"]
            isOneToOne: false
            referencedRelation: "setlist_songs"
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
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          spotify_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          spotify_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
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
          {
            foreignKeyName: "user_artists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_votes: {
        Row: {
          created_at: string | null
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          name: string
          state: string | null
          ticketmaster_id: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          name: string
          state?: string | null
          ticketmaster_id: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string
          state?: string | null
          ticketmaster_id?: string
          updated_at?: string | null
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
      add_song_to_setlist: {
        Args: {
          p_setlist_id: string
          p_song_name: string
          p_spotify_id: string
          p_suggested?: boolean
        }
        Returns: string
      }
      cast_setlist_vote: {
        Args: {
          p_setlist_song_id: string
          p_user_id?: string
          p_ip_address?: string
        }
        Returns: boolean
      }
      cast_song_vote: {
        Args: { p_setlist_song_id: string; p_user_id: string }
        Returns: boolean
      }
      cast_vote: {
        Args: { p_song_id: string; p_user_id?: string; p_ip_address?: string }
        Returns: undefined
      }
      check_sync_health: {
        Args: { platform: string }
        Returns: {
          health_status: string
          last_sync: string
          error_rate: number
        }[]
      }
      get_setlist_with_votes: {
        Args: { setlist_uuid: string }
        Returns: {
          id: string
          song_name: string
          spotify_id: string
          total_votes: number
          suggested: boolean
          order_index: number
        }[]
      }
      initialize_show_setlist: {
        Args:
          | { p_show_id: string; p_artist_name: string }
          | { p_show_id: string; p_spotify_tracks: Json }
        Returns: string
      }
      migrate_cached_shows_to_shows: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_cached_songs_to_songs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      needs_artist_refresh: {
        Args: { last_sync: string; ttl_hours?: number }
        Returns: boolean
      }
      needs_sync: {
        Args: { last_sync: string; ttl_hours?: number }
        Returns: boolean
      }
      needs_venue_refresh: {
        Args: { last_sync: string; ttl_hours?: number }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
