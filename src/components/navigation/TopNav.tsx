import { Link } from "react-router-dom";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export function TopNav() {
  const {
    user,
    signOut
  } = useAuth();
  const handleArtistClick = (artistName: string) => {
    const encodedName = artistName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    window.location.href = `/artist/${encodedName}`;
  };
  return <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
          <span className="text-2xl">TheSet</span>
        </Link>
        
        <div className="flex-1">
          <SearchBar onArtistClick={handleArtistClick} />
        </div>

        <div className="flex items-center gap-4">
          {user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name} />
                    <AvatarFallback>{user.user_metadata.name?.[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Button asChild variant="ghost">
              <Link to="/auth">Sign in</Link>
            </Button>}
        </div>
      </div>
    </div>;
}