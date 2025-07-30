import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session === null && user === null) {
      // No session and no user means not authenticated
      navigate('/auth');
    }
  }, [session, user, navigate]);

  // Show loading while checking auth state
  if (session === null && user === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // User is authenticated
  if (user) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};