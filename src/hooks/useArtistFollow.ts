import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useArtistFollow = (artistId: string) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && artistId) {
      checkFollowStatus();
    }
  }, [user, artistId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_artists')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', artistId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow artists',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_artists')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artistId);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: 'Artist removed from your following list',
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_artists')
          .insert({
            user_id: user.id,
            artist_id: artistId,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: 'Following',
          description: 'Artist added to your following list',
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    toggleFollow,
  };
};