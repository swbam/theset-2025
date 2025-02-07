
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
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-white">theset</h1>
      </div>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-72 bg-background border-l border-white/10"
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
                  <span className="text-sm text-zinc-400">
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
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            >
              Sign in with Spotify
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
