import { supabase } from './client';
import type { Database } from './types';
import type { Json } from './types';

type Platform = 'spotify' | 'ticketmaster';
type Artist = Database['public']['Tables']['artists']['Row'];
type ArtistIdentifier = Database['public']['Tables']['artist_identifiers']['Row'];

type ArtistMetadata = {
  genres?: string[];
  popularity?: number;
  spotify_data?: Record<string, any>;
  ticketmaster_data?: Record<string, any>;
  [key: string]: any;
};

export interface ArtistWithIdentifiers extends Artist {
  identifiers?: ArtistIdentifier[];
}

const parseMetadata = (metadata: Json | null): ArtistMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata as ArtistMetadata;
};

export const artistIdentifiers = {
  /**
   * Get an artist by their platform-specific ID
   */
  async getArtistByPlatformId(platform: Platform, platformId: string): Promise<ArtistWithIdentifiers | null> {
    const { data: artist, error } = await supabase
      .from('artists')
      .select(`
        *,
        identifiers:artist_identifiers(*)
      `)
      .eq('artist_identifiers.platform', platform)
      .eq('artist_identifiers.platform_id', platformId)
      .single();

    if (error) {
      console.error('Error fetching artist by platform ID:', error);
      return null;
    }

    return artist;
  },

  /**
   * Get a platform-specific ID for an artist
   */
  async getPlatformId(artistId: string, platform: Platform): Promise<string | null> {
    const { data, error } = await supabase
      .from('artist_identifiers')
      .select('platform_id')
      .eq('artist_id', artistId)
      .eq('platform', platform)
      .single();

    if (error) {
      console.error('Error fetching platform ID:', error);
      return null;
    }

    return data.platform_id;
  },

  /**
   * Create or update an artist with platform identifiers
   */
  async upsertArtist({
    name,
    metadata = {},
    platformData
  }: {
    name: string;
    metadata?: ArtistMetadata;
    platformData: {
      platform: Platform;
      platformId: string;
      data?: Record<string, any>;
    };
  }): Promise<ArtistWithIdentifiers | null> {
    // First, check if artist exists with this platform ID
    const existingArtist = await this.getArtistByPlatformId(
      platformData.platform,
      platformData.platformId
    );

    if (existingArtist) {
      const existingMetadata = parseMetadata(existingArtist.metadata);
      
      // Update existing artist
      const { data: updatedArtist, error: updateError } = await supabase
        .from('artists')
        .update({
          name,
          metadata: {
            ...existingMetadata,
            ...metadata,
            [`${platformData.platform}_data`]: platformData.data || {}
          }
        })
        .eq('id', existingArtist.id)
        .select(`
          *,
          identifiers:artist_identifiers(*)
        `)
        .single();

      if (updateError) {
        console.error('Error updating artist:', updateError);
        return null;
      }

      return updatedArtist;
    }

    // Create new artist
    const { data: newArtist, error: insertError } = await supabase
      .from('artists')
      .insert({
        name,
        metadata: {
          ...metadata,
          [`${platformData.platform}_data`]: platformData.data || {}
        }
      })
      .select()
      .single();

    if (insertError || !newArtist) {
      console.error('Error creating artist:', insertError);
      return null;
    }

    // Create platform identifier
    const { error: identifierError } = await supabase
      .from('artist_identifiers')
      .insert({
        artist_id: newArtist.id,
        platform: platformData.platform,
        platform_id: platformData.platformId
      });

    if (identifierError) {
      console.error('Error creating artist identifier:', identifierError);
      // Consider rolling back artist creation here
      return null;
    }

    // Fetch complete artist with identifiers
    return await this.getArtistByPlatformId(
      platformData.platform,
      platformData.platformId
    );
  },

  /**
   * Link an additional platform identifier to an existing artist
   */
  async linkPlatformId(
    artistId: string,
    platform: Platform,
    platformId: string,
    platformData?: Record<string, any>
  ): Promise<boolean> {
    // First, check if this platform ID is already linked to another artist
    const existingLink = await this.getArtistByPlatformId(platform, platformId);
    if (existingLink && existingLink.id !== artistId) {
      console.error('Platform ID already linked to different artist');
      return false;
    }

    // Create new identifier
    const { error: identifierError } = await supabase
      .from('artist_identifiers')
      .insert({
        artist_id: artistId,
        platform,
        platform_id: platformId
      });

    if (identifierError) {
      console.error('Error linking platform ID:', identifierError);
      return false;
    }

    // If platform data is provided, update the artist's metadata
    if (platformData) {
      // First get current metadata
      const { data: currentArtist, error: fetchError } = await supabase
        .from('artists')
        .select('metadata')
        .eq('id', artistId)
        .single();

      if (fetchError) {
        console.error('Error fetching current metadata:', fetchError);
        return false;
      }

      const currentMetadata = parseMetadata(currentArtist?.metadata);

      // Update metadata with new platform data
      const { error: updateError } = await supabase
        .from('artists')
        .update({
          metadata: {
            ...currentMetadata,
            [`${platform}_data`]: platformData
          }
        })
        .eq('id', artistId);

      if (updateError) {
        console.error('Error updating artist metadata:', updateError);
        return false;
      }
    }

    return true;
  }
};
