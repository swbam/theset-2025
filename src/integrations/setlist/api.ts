import { supabase } from '@/integrations/supabase/client';
import { syncArtistSongs } from '@/integrations/spotify/api';
import type { StoredSetlistSong } from '@/types/setlist';

export const createSetlistForShow = async (
  showId: string,
  artistId: string,
  artistName: string
) => {
  try {
    console.log('Creating setlist for show:', showId);

    // Check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();

    if (existingSetlist) {
      console.log('Setlist already exists for show:', showId);
      return existingSetlist;
    }

    // Get cached songs for the artist
    let { data: cachedSongs } = await supabase
      .from('cached_songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(10);

    // If no cached songs, sync them from Spotify
    if (!cachedSongs || cachedSongs.length === 0) {
      console.log('No cached songs found, syncing from Spotify...');
      cachedSongs = await syncArtistSongs(artistId, artistName);
    }

    // Create setlist songs array
    const setlistSongs =
      cachedSongs?.map((song, index) => ({
        id: song.id,
        song_name: song.name,
        spotify_id: song.spotify_id,
        album: song.album,
        preview_url: song.preview_url,
        total_votes: 0,
        suggested: false,
        order: index + 1,
      })) || [];

    // Create the setlist
    const { data: newSetlist, error } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
        songs: setlistSongs,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating setlist:', error);
      throw error;
    }

    console.log(
      'Successfully created setlist with',
      setlistSongs.length,
      'songs'
    );
    return newSetlist;
  } catch (error) {
    console.error('Error creating setlist for show:', error);
    throw error;
  }
};

export const addSongToSetlist = async (
  setlistId: string,
  songName: string,
  artistId: string
) => {
  try {
    console.log('Adding song to setlist:', songName);

    // Get current setlist
    const { data: setlist, error: fetchError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('id', setlistId)
      .single();

    if (fetchError) {
      console.error('Error fetching setlist:', fetchError);
      throw fetchError;
    }

    // Parse existing songs
    const existingSongs = Array.isArray(setlist.songs) ? setlist.songs : [];

    // Check if song already exists
    const songExists = existingSongs.some(
      (song: StoredSetlistSong) => song.song_name?.toLowerCase() === songName.toLowerCase()
    );

    if (songExists) {
      throw new Error('Song already exists in setlist');
    }

    // Add new song
    const newSong = {
      id: `song-${Date.now()}`,
      song_name: songName,
      total_votes: 0,
      suggested: true,
      order: existingSongs.length + 1,
    };

    const updatedSongs = [...existingSongs, newSong];

    // Update setlist
    const { error: updateError } = await supabase
      .from('setlists')
      .update({
        songs: updatedSongs,
      })
      .eq('id', setlistId);

    if (updateError) {
      console.error('Error updating setlist:', updateError);
      throw updateError;
    }

    return newSong;
  } catch (error) {
    console.error('Error adding song to setlist:', error);
    throw error;
  }
};

export const voteForSong = async (
  songId: string,
  userId: string,
  showId: string
) => {
  try {
    console.log('Voting for song:', songId);

    // Check if user already voted for this song
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('id')
      .eq('song_id', songId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      throw new Error('You have already voted for this song');
    }

    // Cast vote
    const { error: voteError } = await supabase.from('user_votes').insert({
      song_id: songId,
      user_id: userId,
    });

    if (voteError) {
      console.error('Error casting vote:', voteError);
      throw voteError;
    }

    // Update vote count in setlist
    const { data: setlist, error: fetchError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('show_id', showId)
      .single();

    if (fetchError) {
      console.error('Error fetching setlist for vote update:', fetchError);
      return;
    }

    const songs = Array.isArray(setlist.songs) ? setlist.songs : [];
    const updatedSongs = songs.map((song: StoredSetlistSong & { total_votes?: number }) => {
      if (song.id === songId) {
        return { ...song, total_votes: (song.total_votes || 0) + 1 };
      }
      return song;
    });

    // Update setlist with new vote count
    await supabase
      .from('setlists')
      .update({ songs: updatedSongs })
      .eq('show_id', showId);

    console.log('Successfully voted for song');
  } catch (error) {
    console.error('Error voting for song:', error);
    throw error;
  }
};
