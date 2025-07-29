import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import ArtistPage from './pages/ArtistPage';
import ShowPage from './pages/ShowPage';
import Artists from './pages/Artists';
import Shows from './pages/Shows';
import HowItWorks from './pages/HowItWorks';
import NotFound from './pages/NotFound';
import MyArtists from './pages/MyArtists';
import MyActivity from './pages/MyActivity';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import DashboardHome from './pages/DashboardHome';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth" element={<Auth />} />

              <Route path="/artists" element={<Artists />} />
              <Route path="/shows" element={<Shows />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/artist/:artistName" element={<ArtistPage />} />
              <Route path="/show/:eventId" element={<ShowPage />} />

              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardHome />} />
                <Route path="my-artists" element={<MyArtists />} />
                <Route path="my-activity" element={<MyActivity />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
