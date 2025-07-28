import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Home, Music, User, Settings, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithSpotify, signOut } = useAuth();

  const authenticatedMenuItems = [
    { title: 'Home', icon: Home, path: '/' },
    { title: 'My Artists', icon: Music, path: '/my-artists' },
    { title: 'My Activity', icon: Activity, path: '/my-activity' },
    { title: 'Profile', icon: User, path: '/profile' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  const publicMenuItems = [
    { title: 'Home', icon: Home, path: '/' },
    { title: 'Artists', icon: Music, path: '/artists' },
  ];

  const menuItems = user ? authenticatedMenuItems : publicMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user?.user_metadata?.name}</span>
              <span className="text-xs text-zinc-400">{user?.email}</span>
            </div>
          </div>
        ) : (
          <Button
            onClick={signInWithSpotify}
            className="w-full"
            variant="outline"
          >
            Sign in with Spotify
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
