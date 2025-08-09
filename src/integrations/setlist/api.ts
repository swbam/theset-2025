import { supabase } from '@/integrations/supabase/client';
import { syncArtistSongs } from '@/integrations/spotify/api';
import type { StoredSetlistSong } from '@/types/setlist';
import type { Json } from '@/integrations/supabase/types';

// Deprecated functions in favor of RPC-based and normalized schema usage
export const createSetlistForShow = async (
  _showId: string,
  _artistId: string,
  _artistName: string
) => {
  throw new Error('createSetlistForShow is deprecated. Use initialize_show_setlist via ShowPage.');
};

export const addSongToSetlist = async (
  _setlistId: string,
  _songName: string,
  _artistId: string
) => {
  throw new Error('addSongToSetlist is deprecated. Use add_song_to_setlist RPC instead.');
};

export const voteForSong = async (
  _songId: string,
  _userId: string,
  _showId: string
) => {
  throw new Error('voteForSong is deprecated. Use cast_song_vote RPC instead.');
};