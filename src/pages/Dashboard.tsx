
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RecommendedShows } from "@/components/dashboard/RecommendedShows";

const Dashboard = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        <DashboardSidebar />
        <SidebarInset>
          <div className="h-full p-6">
            <h1 className="text-2xl font-bold mb-2">Welcome Back, {user.user_metadata.name}!</h1>
            <p className="text-zinc-400 mb-6">Here are some shows we think you'll love.</p>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">Recommended For You</h2>
                <RecommendedShows />
              </section>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
