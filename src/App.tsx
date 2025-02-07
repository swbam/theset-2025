
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
                <Route path="/artist/:artistName/show/:eventId" element={<ShowPage />} />
                <Route path="/my-artists" element={<MyArtists />} />
                <Route path="/my-activity" element={<MyActivity />} />
                <Route path="/profile" element={<Index />} />
                <Route path="/settings" element={<Index />} />
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
