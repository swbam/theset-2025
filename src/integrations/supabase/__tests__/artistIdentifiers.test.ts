
import { artistIdentifiers } from '../artistIdentifiers';
import type { Artist } from '../../ticketmaster/types';

describe('artistIdentifiers', () => {
  const mockArtist: Artist = {
    id: '123',
    name: 'Test Artist',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      genres: ['rock', 'pop']
    },
    last_synced_at: new Date().toISOString()
  };

  it('should export artist data', async () => {
    const exportedData = await artistIdentifiers.exportArtistData(mockArtist);
    expect(exportedData).toBeDefined();
    expect(exportedData.name).toBe(mockArtist.name);
  });
});
