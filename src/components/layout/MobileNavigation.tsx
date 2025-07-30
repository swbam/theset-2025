import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, User, Calendar, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Music, label: 'Artists', href: '/artists' },
  { icon: Calendar, label: 'Shows', href: '/shows' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance for navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = navItems.findIndex(item => {
        return location.pathname === item.href || 
               (item.href !== '/' && location.pathname.startsWith(item.href));
      });

      if (isLeftSwipe && currentIndex < navItems.length - 1) {
        // Navigate to next item
        navigate(navItems[currentIndex + 1].href);
      } else if (isRightSwipe && currentIndex > 0) {
        // Navigate to previous item
        navigate(navItems[currentIndex - 1].href);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [touchStart, touchEnd, location.pathname, navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-50">
      <div 
        ref={containerRef}
        className="flex justify-around py-2 relative"
      >
        {/* Swipe indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-600 rounded-full opacity-50" />
        
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