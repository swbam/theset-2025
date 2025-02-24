import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { artistIdentifiers } from '../artistIdentifiers';
import { supabase } from '../client';

// Mock Supabase client
vi.mock('../client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn()
    }))
  }
}));

describe('artistIdentifiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getArtistByPlatformId', () => {
    it('should return artist when found', async () => {
      const mockArtist = {
        id: '123',
        name: 'Test Artist',
        metadata: { genres: ['rock'] },
        identifiers: [
          { platform: 'spotify', platform_id: 'sp123' }
        ]
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockArtist });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any);

      const result = await artistIdentifiers.getArtistByPlatformId('spotify', 'sp123');

      expect(result).toEqual(mockArtist);
      expect(supabase.from).toHaveBeenCalledWith('artists');
      expect(mockSelect).toHaveBeenCalledWith(`
        *,
        identifiers:artist_identifiers(*)
      `);
      expect(mockEq).toHaveBeenCalledWith('artist_identifiers.platform_id', 'sp123');
    });

    it('should return null when artist not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null })
      } as any);

      const result = await artistIdentifiers.getArtistByPlatformId('spotify', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: new Error('Database error') })
      } as any);

      const result = await artistIdentifiers.getArtistByPlatformId('spotify', 'sp123');
      expect(result).toBeNull();
    });
  });

  describe('upsertArtist', () => {
    it('should create new artist when not exists', async () => {
      const mockNewArtist = {
        id: '123',
        name: 'New Artist',
        metadata: { genres: ['pop'] }
      };

      // Mock getArtistByPlatformId to return null (artist doesn't exist)
      vi.spyOn(artistIdentifiers, 'getArtistByPlatformId').mockResolvedValue(null);

      // Mock insert operation
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNewArtist })
      } as any);

      const result = await artistIdentifiers.upsertArtist({
        name: 'New Artist',
        metadata: { genres: ['pop'] },
        platformData: {
          platform: 'spotify',
          platformId: 'sp123',
          data: { type: 'artist' }
        }
      });

      expect(result).toBeTruthy();
      expect(supabase.from).toHaveBeenCalledWith('artists');
    });

    it('should update existing artist when found', async () => {
      const mockExistingArtist = {
        id: '123',
        name: 'Existing Artist',
        metadata: { genres: ['rock'] }
      };

      // Mock getArtistByPlatformId to return existing artist
      vi.spyOn(artistIdentifiers, 'getArtistByPlatformId').mockResolvedValue(mockExistingArtist);

      // Mock update operation
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockExistingArtist, name: 'Updated Name' } })
      } as any);

      const result = await artistIdentifiers.upsertArtist({
        name: 'Updated Name',
        metadata: { genres: ['rock', 'pop'] },
        platformData: {
          platform: 'spotify',
          platformId: 'sp123',
          data: { type: 'artist' }
        }
      });

      expect(result).toBeTruthy();
      expect(result?.name).toBe('Updated Name');
    });
  });

  describe('linkPlatformId', () => {
    it('should link new platform ID to existing artist', async () => {
      // Mock that the platform ID isn't already linked
      vi.spyOn(artistIdentifiers, 'getArtistByPlatformId').mockResolvedValue(null);

      // Mock insert operation for new identifier
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { metadata: {} } })
      } as any);

      const result = await artistIdentifiers.linkPlatformId(
        '123',
        'ticketmaster',
        'tm123',
        { venue_count: 5 }
      );

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('artist_identifiers');
    });

    it('should handle platform ID already linked to different artist', async () => {
      // Mock that the platform ID is linked to a different artist
      vi.spyOn(artistIdentifiers, 'getArtistByPlatformId').mockResolvedValue({
        id: '456', // Different artist ID
        name: 'Different Artist'
      });

      const result = await artistIdentifiers.linkPlatformId(
        '123',
        'ticketmaster',
        'tm123'
      );

      expect(result).toBe(false);
    });
  });
});
