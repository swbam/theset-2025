
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MobileNav = () => {
  const navigate = useNavigate();
  const { user, signInWithSpotify, signOut } = useAuth();
  
  const menuItems = [
    { title: "Home", path: "/" },
    { title: "My Artists", path: "/my-artists" },
    { title: "My Activity", path: "/my-activity" },
    { title: "Profile", path: "/profile" },
    { title: "Settings", path: "/settings" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-72 bg-[#1A1F2C] border-r border-white/10"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-white/5">
                <div className="flex flex-col">
                  <span className="font-medium text-white">
                    {user?.user_metadata?.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {user?.email}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={() => navigate(item.path)}
                  >
                    {item.title}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={signInWithSpotify}
              className="w-full bg-[#9b87f5] hover:bg-[#8b77e5] text-white"
            >
              Sign in with Spotify
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
