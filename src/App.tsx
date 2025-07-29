import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

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
            <SidebarProvider>
              <div className="min-h-screen flex w-full bg-background">
                {/* Desktop Sidebar */}
                <DashboardSidebar />
                
                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                  {/* Top Navigation */}
                  <TopNavigation />
                  
                  {/* Page Content */}
                  <div className="flex-1 pb-16 md:pb-0">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="artists" element={<MyArtists />} />
                        <Route path="activity" element={<MyActivity />} />
                      </Route>
                      <Route path="/artists" element={<Artists />} />
                      <Route path="/artists/:id" element={<ArtistPage />} />
                      <Route path="/shows" element={<Shows />} />
                      <Route path="/shows/:id" element={<ShowPage />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
                
                {/* Mobile Navigation */}
                <MobileNavigation />
              </div>
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
