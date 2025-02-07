
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
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-2 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{user?.user_metadata?.name}</span>
                  <span className="text-xs text-zinc-400">{user?.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigate(item.path)}
                  >
                    {item.title}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={signInWithSpotify}
              className="w-full"
              variant="outline"
            >
              Sign in with Spotify
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
