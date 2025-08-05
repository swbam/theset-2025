import { Home, Search, User, Music } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/following', icon: User, label: 'Following' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only show on small screens
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex justify-between">
        {TABS.map((tab) => {
          const ActiveIcon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              aria-label={tab.label}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center flex-1 py-2 relative"
            >
              <ActiveIcon
                size={24}
                className={cn('transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}
              />
              <span className="text-xs mt-1">{tab.label}</span>

              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
