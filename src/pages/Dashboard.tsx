
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/mobile/MobileNav";

export default function Dashboard() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        {!isMobile && <DashboardSidebar />}
        <main className="flex-1 overflow-auto">
          {isMobile && (
            <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#1A1F2C]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1A1F2C]/60">
              <div className="flex h-14 items-center px-4">
                <MobileNav />
                <div className="flex-1 text-center">
                  <h1 className="text-lg font-semibold text-white">theset</h1>
                </div>
                <div className="w-10" /> {/* Spacer for visual balance */}
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
