import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { HelmetProvider } from "react-helmet-async";

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
        <HelmetProvider>
          <BrowserRouter>
            <AuthProvider>
              <ThemeProvider>
                <div className="min-h-screen bg-background transition-colors duration-300">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/search" element={<Search />} />

                    {/* Dashboard (protected) */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardHome />} />
                      <Route path="artists" element={<MyArtists />} />
                      <Route path="activity" element={<MyActivity />} />
                    </Route>

                    {/* Shortcuts to protected views */}
                    <Route
                      path="/my-artists"
                      element={
                        <ProtectedRoute>
                          <MyArtists />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-activity"
                      element={
                        <ProtectedRoute>
                          <MyActivity />
                        </ProtectedRoute>
                      }
                    />

                    {/* Public lists */}
                    <Route path="/artists" element={<Artists />} />
                    <Route path="/artist/:artistSlug" element={<ArtistPage />} />
                    <Route path="/shows" element={<Shows />} />
                    <Route path="/show/:showSlug" element={<ShowPage />} />

                    {/* Profile & settings (protected) */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />

                    {/* Misc */}
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <Admin />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>

                  {/* Mobile bottom navigation */}
                  <BottomNav />
                </div>
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
