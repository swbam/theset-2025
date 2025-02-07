
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/mobile/MobileNav";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export default function Dashboard() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        {!isMobile && <DashboardSidebar />}
        <main className="flex-1 overflow-auto">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
