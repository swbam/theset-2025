import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, User, Calendar, Music, LogIn, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function MobileNavigation() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user ? [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Calendar, label: 'Shows', href: '/shows' },
    { icon: Heart, label: 'My Artists', href: '/my-artists' },
    { icon: User, label: 'Profile', href: '/profile' },
  ] : [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Calendar, label: 'Shows', href: '/shows' },
    { icon: LogIn, label: 'Sign In', href: '/auth' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive: linkActive }) =>
                cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                  linkActive || isActive
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}