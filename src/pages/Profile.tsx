import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Music, User, Calendar, Mail, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  spotify_id?: string;
  created_at: string;
}

export default function Profile() {
  const { user, signOut, isSpotifyUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName || null,
          bio: bio || null,
        });

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-zinc-400">Manage your account settings</p>
        </div>

        {/* Profile Information */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-zinc-800 text-white">
                  {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {profile?.display_name || user?.user_metadata?.name || user?.email}
                </h3>
                {isSpotifyUser && (
                  <Badge variant="secondary" className="mt-1 bg-[#1DB954] text-black">
                    <Music className="h-3 w-3 mr-1" />
                    Spotify Connected
                  </Badge>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-white">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile?.display_name || '');
                      setBio(profile?.bio || '');
                    }}
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Display Name</Label>
                  <p className="text-sm text-zinc-400 mt-1">
                    {profile?.display_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-white">Bio</Label>
                  <p className="text-sm text-zinc-400 mt-1">
                    {profile?.bio || 'No bio yet'}
                  </p>
                </div>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-white">Email</Label>
                <p className="text-sm text-zinc-400">{user?.email}</p>
              </div>
              <Badge variant={user?.email_confirmed_at ? "default" : "secondary"}>
                {user?.email_confirmed_at ? "Verified" : "Unverified"}
              </Badge>
            </div>

            <Separator className="bg-zinc-700" />

            <div>
              <Label className="text-white">Connected Services</Label>
              <div className="mt-2 space-y-2">
                {isSpotifyUser ? (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-[#1DB954]" />
                    <span className="text-sm text-white">Spotify</span>
                    <Badge variant="default" className="bg-[#1DB954] text-black">Connected</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No connected services</p>
                )}
              </div>
            </div>

            <Separator className="bg-zinc-700" />

            <div className="flex justify-between items-center">
              <div>
                <Label className="text-white">Member Since</Label>
                <p className="text-sm text-zinc-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(user?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator className="bg-zinc-700" />

            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}