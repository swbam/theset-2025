import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function TopNavigation() {
  const navigate = useNavigate();
  const { user, signInWithSpotify } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Artists', path: '/artists' },
    { label: 'Upcoming Shows', path: '/shows' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <nav className="w-full bg-black border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="text-xl font-bold text-white cursor-pointer"
            onClick={() => navigate('/')}
          >
            TheSet
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="text-zinc-300 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Auth Button */}
          <div className="hidden md:flex">
            {user ? (
              <Button variant="outline" className="text-white border-zinc-700">
                {user.email}
              </Button>
            ) : (
              <Button
                onClick={signInWithSpotify}
                className="bg-white text-black hover:bg-zinc-200"
              >
                Log in
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800">
            <div className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-zinc-300 hover:text-white transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
              {user ? (
                <Button
                  variant="outline"
                  className="text-white border-zinc-700 w-fit"
                >
                  {user.email}
                </Button>
              ) : (
                <Button
                  onClick={signInWithSpotify}
                  className="bg-white text-black hover:bg-zinc-200 w-fit"
                >
                  Log in
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
