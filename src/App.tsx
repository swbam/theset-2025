import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import Artists from "./pages/Artists";
import ArtistPage from "./pages/ArtistPage";
import Shows from "./pages/Shows";
import ShowPage from "./pages/ShowPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MyArtists from "./pages/MyArtists";
import MyActivity from "./pages/MyActivity";
import HowItWorks from "./pages/HowItWorks";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/search" element={<Search />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                  <Route index element={<DashboardHome />} />
                  <Route path="artists" element={<MyArtists />} />
                  <Route path="activity" element={<MyActivity />} />
                </Route>
                <Route path="/my-artists" element={<ProtectedRoute><MyArtists /></ProtectedRoute>} />
                <Route path="/my-activity" element={<ProtectedRoute><MyActivity /></ProtectedRoute>} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/artist/:artistName" element={<ArtistPage />} />
                <Route path="/shows" element={<Shows />} />
                <Route path="/show/:showId" element={<ShowPage />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              {/* Mobile Navigation */}
              <MobileNavigation />
            </div>
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
