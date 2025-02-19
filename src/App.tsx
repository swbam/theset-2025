import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TopNav } from "./components/navigation/TopNav";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ArtistPage from "./pages/ArtistPage";
import ShowPage from "./pages/ShowPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import MyArtists from "./pages/MyArtists";
import MyActivity from "./pages/MyActivity";
import Settings from "./pages/Settings";

// Legacy route handler that redirects to the new format
const LegacyShowRoute = () => {
  const { artistName, eventId } = useParams();
  const navigate = useNavigate();

  // Redirect to the new URL format
  // The ShowPage component will handle filling in the location and date
  navigate(`/artist/${artistName}/show-details/${eventId}`, { replace: true });
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <TopNav />
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Dashboard />}>
                <Route index element={<Index />} />
                <Route path="/artist/:artistName" element={<ArtistPage />} />
                {/* New SEO-friendly show routes */}
                <Route path="/artist/:artistName/:location/:date/:eventId" element={<ShowPage />} />
                <Route path="/artist/:artistName/show-details/:eventId" element={<ShowPage />} />
                {/* Legacy route that redirects to new format */}
                <Route path="/artist/:artistName/show/:eventId" element={<LegacyShowRoute />} />
                <Route path="/my-artists" element={<MyArtists />} />
                <Route path="/my-activity" element={<MyActivity />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
