import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  artistId: string;
  userId?: string | null;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ artistId, userId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('user_id', userId)
        .eq('artist_id', artistId)
        .maybeSingle();
      setIsFollowing(!!data);
      setLoading(false);
    })();
  }, [artistId, userId]);

  const toggleFollow = async () => {
    if (!userId) {
      toast({
        title: 'Please sign in',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('user_id', userId)
          .eq('artist_id', artistId);
        setIsFollowing(false);
      } else {
        await supabase.from('user_follows').insert({ user_id: userId, artist_id: artistId });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('follow error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={toggleFollow} disabled={loading} variant={isFollowing ? 'secondary' : 'default'}>
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

